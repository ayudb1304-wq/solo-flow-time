import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const webhookData = JSON.parse(body);

    console.log('Webhook received:', webhookData);

    // Handle different webhook events
    if (webhookData.event === 'subscription.activated' || webhookData.event === 'payment.captured') {
      const { payload } = webhookData;
      const subscription = payload.subscription?.entity || payload.payment?.entity;
      const userId = subscription.notes?.user_id;
      const plan = subscription.notes?.plan;

      console.log('Processing webhook event:', webhookData.event);
      console.log('User ID:', userId);
      console.log('Plan:', plan);

      if (userId && plan) {
        // Update user subscription status
        const { error } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: plan,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }

        console.log(`Updated user ${userId} to ${plan} plan`);
        
        // Send welcome email to new pro subscribers
        if (plan === 'pro') {
          try {
            // Get user details for welcome email
            const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
            
            if (!userError && userData.user) {
              // Send welcome email
              const { error: emailError } = await supabaseClient.functions.invoke('send-welcome-email', {
                body: {
                  userId: userId,
                  userEmail: userData.user.email,
                  userName: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0],
                  plan: plan
                }
              });
              
              if (emailError) {
                console.error('Error sending welcome email:', emailError);
              } else {
                console.log(`Welcome email sent to ${userData.user.email}`);
              }
            }
          } catch (emailError) {
            console.error('Error processing welcome email:', emailError);
          }
        }
      } else {
        console.log('Missing userId or plan in webhook data');
      }
    }

    if (webhookData.event === 'subscription.cancelled' || webhookData.event === 'subscription.expired') {
      const { payload } = webhookData;
      const subscription = payload.subscription.entity;
      const userId = subscription.notes?.user_id;

      if (userId) {
        // Downgrade to trial
        const { error } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: 'trial',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error downgrading subscription:', error);
          throw error;
        }

        console.log(`Downgraded user ${userId} to trial`);
      }
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});