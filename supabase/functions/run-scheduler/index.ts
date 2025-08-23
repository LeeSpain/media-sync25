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

    console.log('Running content scheduler...');

    // Get content scheduled for now or earlier that hasn't been published
    const now = new Date().toISOString();
    const { data: scheduledContent, error: contentError } = await supabase
      .from('content_schedule')
      .select(`
        *,
        content_items(*),
        connected_accounts(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (contentError) {
      throw new Error(`Failed to get scheduled content: ${contentError.message}`);
    }

    console.log(`Found ${scheduledContent?.length || 0} items to publish`);

    let published = 0;
    let failed = 0;

    for (const scheduleItem of scheduledContent || []) {
      try {
        console.log(`Publishing content: ${scheduleItem.content_items?.title} to ${scheduleItem.channel}`);

        // Update schedule status to publishing
        await supabase
          .from('content_schedule')
          .update({ status: 'publishing' })
          .eq('id', scheduleItem.id);

        let publishResult;

        // Route to appropriate publisher based on channel
        switch (scheduleItem.channel) {
          case 'twitter':
            publishResult = await supabase.functions.invoke('publish-twitter', {
              body: {
                contentId: scheduleItem.content_id,
                tweet: scheduleItem.content_items?.content || '',
              },
              headers: {
                Authorization: `Bearer ${supabaseKey}`
              }
            });
            break;

          case 'linkedin':
            // LinkedIn publishing would go here
            console.log('LinkedIn publishing not yet implemented');
            publishResult = { error: 'LinkedIn publishing not yet implemented' };
            break;

          case 'facebook':
            // Facebook publishing would go here  
            console.log('Facebook publishing not yet implemented');
            publishResult = { error: 'Facebook publishing not yet implemented' };
            break;

          case 'instagram':
            // Instagram publishing would go here
            console.log('Instagram publishing not yet implemented');
            publishResult = { error: 'Instagram publishing not yet implemented' };
            break;

          default:
            throw new Error(`Unsupported channel: ${scheduleItem.channel}`);
        }

        if (publishResult?.error) {
          throw new Error(`Publish failed: ${publishResult.error.message || publishResult.error}`);
        }

        // Update schedule status to published
        await supabase
          .from('content_schedule')
          .update({ 
            status: 'published',
            publish_result: publishResult?.data || publishResult
          })
          .eq('id', scheduleItem.id);

        published++;
        console.log(`Successfully published to ${scheduleItem.channel}`);

      } catch (error) {
        console.error(`Failed to publish content ${scheduleItem.id}:`, error);
        failed++;

        // Update schedule status to failed
        try {
          await supabase
            .from('content_schedule')
            .update({ 
              status: 'failed',
              publish_result: { 
                error: error.message,
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', scheduleItem.id);
        } catch (updateError) {
          console.error(`Failed to update schedule status:`, updateError);
        }
      }
    }

    // Also check for auto-mode businesses that need content generation
    const { data: autoBusinesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('auto_mode', true);

    if (!businessError && autoBusinesses) {
      console.log(`Found ${autoBusinesses.length} auto-mode businesses`);

      for (const business of autoBusinesses) {
        try {
          // Check if business needs new content (e.g., hasn't posted in 24 hours)
          const { data: recentContent } = await supabase
            .from('content_queue')
            .select('*')
            .eq('business_id', business.id)
            .eq('status', 'published')
            .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!recentContent || recentContent.length === 0) {
            console.log(`Triggering content generation for business: ${business.name}`);
            
            // Trigger master agent to generate new content
            await supabase.functions.invoke('master-agent', {
              body: {
                businessId: business.id,
                action: 'orchestrate',
                data: {
                  contentType: ['post'],
                  platforms: ['twitter', 'linkedin'],
                  autoMode: true
                }
              },
              headers: {
                Authorization: `Bearer ${supabaseKey}`
              }
            });
          }

        } catch (error) {
          console.error(`Failed to check auto-mode for business ${business.id}:`, error);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      published,
      failed,
      message: `Published ${published} items, ${failed} failed`
    }), {
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