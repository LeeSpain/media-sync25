import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'npm:resend@4.0.0';

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { campaignId, testEmail }: SendCampaignRequest = await req.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('created_by', user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found or access denied');
    }

    if (testEmail) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: campaign.from_address || 'noreply@yourdomain.com',
          to: [testEmail],
          subject: `[TEST] ${campaign.subject}`,
          html: campaign.html,
          text: campaign.text,
        });

        if (sendError) {
          throw sendError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Test email sent successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        throw new Error(`Failed to send test email: ${error.message}`);
      }
    }

    const { data: recipients, error: recipientsError } = await supabase
      .from('email_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'queued');

    if (recipientsError) {
      throw new Error(`Failed to fetch recipients: ${recipientsError.message}`);
    }

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients found for this campaign');
    }

    const { data: variants, error: variantsError } = await supabase
      .from('email_campaign_variants')
      .select('*')
      .eq('campaign_id', campaignId);

    const hasVariants = variants && variants.length > 0;
    const batchSize = 50;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (recipient) => {
        try {
          await supabase
            .from('email_recipients')
            .update({ status: 'sending' })
            .eq('id', recipient.id);

          let emailContent = {
            subject: campaign.subject,
            html: campaign.html,
            text: campaign.text
          };

          if (hasVariants && recipient.variant_key) {
            const variant = variants.find(v => v.variant_key === recipient.variant_key);
            if (variant) {
              emailContent = {
                subject: variant.subject || campaign.subject,
                html: variant.html || campaign.html,
                text: variant.text || campaign.text
              };
            }
          }

          const { data: emailData, error: sendError } = await resend.emails.send({
            from: campaign.from_address || 'noreply@yourdomain.com',
            to: [recipient.email_address],
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          if (sendError) {
            throw sendError;
          }

          await supabase
            .from('email_recipients')
            .update({ 
              status: 'sent',
              message_id: emailData?.id || null,
              last_event_at: new Date().toISOString()
            })
            .eq('id', recipient.id);

          await supabase
            .from('email_events')
            .insert({
              campaign_id: campaignId,
              recipient_id: recipient.id,
              event_type: 'sent',
              created_by: user.id,
              payload: { message_id: emailData?.id }
            });

          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email_address}:`, error);
          
          await supabase
            .from('email_recipients')
            .update({ 
              status: 'failed',
              error: error.message,
              last_event_at: new Date().toISOString()
            })
            .eq('id', recipient.id);

          failureCount++;
        }
      }));
    }

    const currentStats = campaign.statistics || {};
    await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sent',
        statistics: {
          ...currentStats,
          sent: successCount,
          failed: failureCount,
          total_recipients: recipients.length,
          sent_at: new Date().toISOString()
        }
      })
      .eq('id', campaignId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Campaign sent successfully',
      statistics: {
        sent: successCount,
        failed: failureCount,
        total: recipients.length
      }
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