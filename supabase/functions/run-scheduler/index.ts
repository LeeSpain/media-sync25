import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let publishedCount = 0;
    let failedCount = 0;
    const failures: any[] = [];

    console.log('Checking for scheduled content...');
    
    const { data: scheduledContent, error: scheduleError } = await supabase
      .from('content_schedule')
      .select(`
        *,
        content_items(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (scheduleError) {
      console.error('Error fetching scheduled content:', scheduleError);
    } else if (scheduledContent && scheduledContent.length > 0) {
      console.log(`Found ${scheduledContent.length} items to publish`);

      for (const item of scheduledContent) {
        try {
          await supabase
            .from('content_schedule')
            .update({ status: 'publishing' })
            .eq('id', item.id);

          if (item.channel === 'twitter') {
            const { error: publishError } = await supabase.functions.invoke('publish-twitter', {
              body: {
                content: item.content_items.content,
                contentId: item.content_id
              }
            });

            if (publishError) {
              throw publishError;
            }

            await supabase
              .from('content_schedule')
              .update({ 
                status: 'published',
                publish_result: { published_at: new Date().toISOString() }
              })
              .eq('id', item.id);

            publishedCount++;
            console.log(`Published content ${item.id} to Twitter`);
          } else {
            throw new Error(`Unsupported channel: ${item.channel}`);
          }
        } catch (error) {
          console.error(`Failed to publish content ${item.id}:`, error);
          
          await supabase
            .from('content_schedule')
            .update({ 
              status: 'failed',
              publish_result: { error: error.message, failed_at: new Date().toISOString() }
            })
            .eq('id', item.id);

          failedCount++;
          failures.push({
            contentId: item.id,
            error: error.message
          });
        }
      }
    }

    console.log('Checking for auto-mode businesses...');
    
    const { data: autoBusinesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('auto_mode', true);

    if (businessError) {
      console.error('Error fetching auto-mode businesses:', businessError);
    } else if (autoBusinesses && autoBusinesses.length > 0) {
      console.log(`Found ${autoBusinesses.length} auto-mode businesses`);

      for (const business of autoBusinesses) {
        try {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          
          const { data: recentContent, error: contentError } = await supabase
            .from('content_queue')
            .select('*')
            .eq('business_id', business.id)
            .eq('status', 'published')
            .gte('published_at', twentyFourHoursAgo);

          if (contentError) {
            console.error(`Error checking recent content for business ${business.id}:`, contentError);
            continue;
          }

          if (!recentContent || recentContent.length === 0) {
            console.log(`Triggering content generation for business ${business.id}`);
            
            const { error: agentError } = await supabase.functions.invoke('master-agent', {
              body: {
                businessId: business.id,
                action: 'orchestrateAgents',
                orchestrationData: {
                  contentType: 'social_post',
                  platforms: ['twitter'],
                  autoMode: true
                }
              }
            });

            if (agentError) {
              console.error(`Failed to trigger content generation for business ${business.id}:`, agentError);
              failures.push({
                businessId: business.id,
                error: agentError.message
              });
            } else {
              console.log(`Successfully triggered content generation for business ${business.id}`);
            }
          } else {
            console.log(`Business ${business.id} has recent content, skipping`);
          }
        } catch (error) {
          console.error(`Error processing auto-mode business ${business.id}:`, error);
          failures.push({
            businessId: business.id,
            error: error.message
          });
        }
      }
    }

    const response = {
      success: true,
      message: 'Scheduler run completed',
      statistics: {
        content_published: publishedCount,
        content_failed: failedCount,
        auto_businesses_processed: autoBusinesses?.length || 0
      },
      failures: failures.length > 0 ? failures : undefined
    };

    console.log('Scheduler completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in run-scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});