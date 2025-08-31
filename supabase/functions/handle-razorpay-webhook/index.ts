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
    const event: string = webhookData.event;
    const activationEvents = new Set([
      'subscription.activated',
      'subscription.charged', // fires on successful charge for subscriptions
      'invoice.paid',         // safety: invoice payment completed
      'payment.captured',     // initial payment captured
    ]);

    // Helper: fetch subscription notes from Razorpay when not present in payload
    const getNotesFromRazorpay = async (subscriptionId?: string): Promise<Record<string, any> | null> => {
      try {
        if (!subscriptionId) return null;
        const keyId = Deno.env.get('RAZORPAY_KEY_ID');
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!keyId || !keySecret) {
          console.warn('Razorpay keys not configured; cannot backfill notes');
          return null;
        }
        const auth = btoa(`${keyId}:${keySecret}`);
        const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}` , {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          }
        });
        if (!res.ok) {
          console.warn('Failed to fetch subscription from Razorpay', await res.text());
          return null;
        }
        const sub = await res.json();
        return sub?.notes ?? null;
      } catch (e) {
        console.error('Error fetching subscription from Razorpay:', e);
        return null;
      }
    };

    if (activationEvents.has(event)) {
      const { payload } = webhookData;
      const subscriptionEntity = payload.subscription?.entity;
      const paymentEntity = payload.payment?.entity;

      let userId = subscriptionEntity?.notes?.user_id || paymentEntity?.notes?.user_id;
      let plan = subscriptionEntity?.notes?.plan || paymentEntity?.notes?.plan;

      console.log('Processing activation-like event:', event, { userId, plan });

      // Backfill from Razorpay if notes are missing
      if (!userId || !plan) {
        const subscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id;
        const fetchedNotes = await getNotesFromRazorpay(subscriptionId);
        userId = userId || fetchedNotes?.user_id;
        plan = plan || fetchedNotes?.plan;
        console.log('Backfilled notes from Razorpay:', { userId, plan });
      }

      if (userId && plan) {
        const { error } = await supabaseClient
          .from('profiles')
          .update({
            subscription_status: plan,
            subscription_cancel_at_period_end: false,
            subscription_period_end: null,
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
            const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
            if (!userError && userData.user) {
              const { error: emailError } = await supabaseClient.functions.invoke('send-welcome-email', {
                body: {
                  userId: userId,
                  userEmail: userData.user.email,
                  userName: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0],
                  plan: plan,
                },
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
        console.log('Missing userId or plan in webhook data and could not backfill');
      }
    }

    if (event === 'subscription.cancelled' || event === 'subscription.expired') {
      const { payload } = webhookData;
      const subscription = payload.subscription.entity;
      const userId = subscription.notes?.user_id;

      if (userId) {
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