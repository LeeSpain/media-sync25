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

    console.log('Processing scheduled email campaigns...');

    // Get campaigns scheduled for now or earlier that haven't been sent yet
    const now = new Date().toISOString();
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (campaignsError) {
      throw new Error(`Failed to get scheduled campaigns: ${campaignsError.message}`);
    }

    console.log(`Found ${campaigns?.length || 0} campaigns to process`);

    let processed = 0;
    let failed = 0;

    for (const campaign of campaigns || []) {
      try {
        console.log(`Processing campaign: ${campaign.name} (${campaign.id})`);

        // Update campaign status to sending
        await supabase
          .from('email_campaigns')
          .update({ status: 'sending' })
          .eq('id', campaign.id);

        // Call send-email-campaign function
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-email-campaign', {
          body: { campaignId: campaign.id },
          headers: {
            Authorization: `Bearer ${supabaseKey}`
          }
        });

        if (sendError) {
          throw new Error(`Failed to send campaign: ${sendError.message}`);
        }

        console.log(`Campaign sent successfully:`, sendResult);
        processed++;

      } catch (error) {
        console.error(`Failed to process campaign ${campaign.id}:`, error);
        failed++;

        // Update campaign status to failed
        try {
          await supabase
            .from('email_campaigns')
            .update({ 
              status: 'failed',
              statistics: {
                ...campaign.statistics,
                error: error.message,
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', campaign.id);
        } catch (updateError) {
          console.error(`Failed to update campaign status:`, updateError);
        }
      }
    }

    // Also process any outreach sequences that are due
    const { data: sequences, error: sequencesError } = await supabase
      .from('outreach_sequences')
      .select('*')
      .eq('status', 'active')
      .lte('next_send_at', now);

    if (!sequencesError && sequences) {
      console.log(`Found ${sequences.length} outreach sequences to process`);

      for (const sequence of sequences) {
        try {
          // Get the leads in this sequence
          const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('outreach_sequence_id', sequence.id)
            .eq('status', 'in_sequence');

          for (const lead of leads || []) {
            // Check if it's time for the next email in sequence
            const lastInteraction = await supabase
              .from('lead_interactions')
              .select('*')
              .eq('lead_id', lead.id)
              .eq('type', 'email_sent')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const daysSinceLastEmail = lastInteraction.data 
              ? Math.floor((Date.now() - new Date(lastInteraction.data.created_at).getTime()) / (1000 * 60 * 60 * 24))
              : 999;

            if (daysSinceLastEmail >= (sequence.delay_days || 1)) {
              // Send next email in sequence
              // This would typically call another function or service
              console.log(`Should send next email to lead ${lead.id} in sequence ${sequence.id}`);
              processed++;
            }
          }

        } catch (sequenceError) {
          console.error(`Failed to process sequence ${sequence.id}:`, sequenceError);
          failed++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      failed,
      message: `Processed ${processed} scheduled items, ${failed} failed`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in email-process-scheduled:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});