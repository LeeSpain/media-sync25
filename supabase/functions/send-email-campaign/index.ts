import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendCampaignRequest {
  campaignId: string;
  testEmail?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

    const { campaignId, testEmail }: SendCampaignRequest = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Verify user owns the campaign
    if (campaign.created_by !== user.id) {
      throw new Error('Unauthorized to send this campaign');
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    if (testEmail) {
      // Send test email
      try {
        const emailResponse = await resend.emails.send({
          from: campaign.from_address || 'noreply@yourdomain.com',
          to: [testEmail],
          subject: `[TEST] ${campaign.subject}`,
          html: campaign.html,
          text: campaign.text || undefined,
        });

        console.log('Test email sent:', emailResponse);
        emailsSent = 1;

        // Log test email event
        await supabase
          .from('email_events')
          .insert({
            campaign_id: campaignId,
            created_by: user.id,
            event_type: 'sent',
            payload: { 
              test_email: testEmail,
              message_id: emailResponse.data?.id 
            }
          });

      } catch (error) {
        console.error('Failed to send test email:', error);
        emailsFailed = 1;
      }

    } else {
      // Send to campaign recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from('email_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'queued');

      if (recipientsError) {
        throw new Error('Failed to get recipients');
      }

      // Process recipients in batches
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        for (const recipient of batch) {
          try {
            // Get variant content if A/B testing
            let subject = campaign.subject;
            let html = campaign.html;
            let text = campaign.text;

            if (recipient.variant_key) {
              const { data: variant } = await supabase
                .from('email_campaign_variants')
                .select('*')
                .eq('campaign_id', campaignId)
                .eq('variant_key', recipient.variant_key)
                .single();

              if (variant) {
                subject = variant.subject || subject;
                html = variant.html || html;
                text = variant.text || text;
              }
            }

            const emailResponse = await resend.emails.send({
              from: campaign.from_address || 'noreply@yourdomain.com',
              to: [recipient.email_address],
              subject: subject,
              html: html,
              text: text || undefined,
            });

            // Update recipient status
            await supabase
              .from('email_recipients')
              .update({
                status: 'sent',
                message_id: emailResponse.data?.id,
                last_event_at: new Date().toISOString()
              })
              .eq('id', recipient.id);

            // Log send event
            await supabase
              .from('email_events')
              .insert({
                campaign_id: campaignId,
                recipient_id: recipient.id,
                created_by: user.id,
                event_type: 'sent',
                payload: { 
                  message_id: emailResponse.data?.id,
                  variant_key: recipient.variant_key
                }
              });

            emailsSent++;
            console.log(`Email sent to ${recipient.email_address}`);

          } catch (error) {
            console.error(`Failed to send email to ${recipient.email_address}:`, error);
            emailsFailed++;

            // Update recipient with error
            await supabase
              .from('email_recipients')
              .update({
                status: 'failed',
                error: error.message,
                last_event_at: new Date().toISOString()
              })
              .eq('id', recipient.id);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update campaign status and statistics
      const newStats = {
        ...campaign.statistics,
        emails_sent: (campaign.statistics?.emails_sent || 0) + emailsSent,
        emails_failed: (campaign.statistics?.emails_failed || 0) + emailsFailed,
        last_sent_at: new Date().toISOString()
      };

      await supabase
        .from('email_campaigns')
        .update({
          status: emailsFailed === 0 ? 'sent' : 'partially_sent',
          statistics: newStats
        })
        .eq('id', campaignId);
    }

    return new Response(JSON.stringify({
      success: true,
      emailsSent,
      emailsFailed,
      message: testEmail ? 'Test email sent' : `Campaign sent to ${emailsSent} recipients`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-email-campaign:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});