import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishTwitterRequest {
  contentId?: string;
  tweet: string;
  mediaUrls?: string[];
  connectedAccountId: string;
}

// Twitter OAuth 1.0a implementation
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  
  return signature;
}

function generateOAuthHeader(
  method: string, 
  url: string, 
  accessToken: string, 
  accessTokenSecret: string
): string {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY")!;
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")!

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret!,
    accessTokenSecret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return (
    "OAuth " +
    Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function sendTweet(tweetText: string, accessToken: string, accessTokenSecret: string): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(method, url, accessToken, accessTokenSecret);

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: tweetText }),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate Twitter app credentials
    const requiredKeys = ['TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET'];
    for (const key of requiredKeys) {
      if (!Deno.env.get(key)) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    const { contentId, tweet, mediaUrls, connectedAccountId }: PublishTwitterRequest = await req.json();

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

    // Get user's connected Twitter account
    const { data: connectedAccount, error: accountError } = await supabase
      .from('connected_accounts')
      .select('access_token, refresh_token, account_name, status')
      .eq('id', connectedAccountId)
      .eq('created_by', user.id)
      .eq('provider', 'twitter')
      .single();

    if (accountError || !connectedAccount) {
      throw new Error('Twitter account not found or not connected');
    }

    if (connectedAccount.status !== 'connected') {
      throw new Error('Twitter account is not in connected status');
    }

    if (!connectedAccount.access_token || !connectedAccount.refresh_token) {
      throw new Error('Twitter account tokens are missing');
    }

    console.log(`Publishing tweet for account ${connectedAccount.account_name}: ${tweet.substring(0, 50)}...`);

    // Send tweet to Twitter using user's tokens
    const twitterResponse = await sendTweet(tweet, connectedAccount.access_token, connectedAccount.refresh_token);
    console.log('Tweet published successfully:', twitterResponse);

    // Create publish job record
    const { data: publishJob, error: jobError } = await supabase
      .from('publish_jobs')
      .insert({
        content_id: contentId,
        platform: 'twitter',
        status: 'completed',
        created_by: user.id,
        external_id: twitterResponse.data?.id,
        metadata: {
          tweet_text: tweet,
          twitter_response: twitterResponse,
          published_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create publish job:', jobError);
    }

    // Update content item if provided
    if (contentId) {
      await supabase
        .from('content_items')
        .update({ 
          status: 'published',
          metadata: {
            published_platforms: ['twitter'],
            twitter_post_id: twitterResponse.data?.id
          }
        })
        .eq('id', contentId);
    }

    return new Response(JSON.stringify({
      success: true,
      twitterResponse,
      publishJob,
      message: 'Tweet published successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in publish-twitter:', error);
    
    // Log failed publish job
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('publish_jobs')
        .insert({
          platform: 'twitter',
          status: 'failed',
          metadata: { error: error.message }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});