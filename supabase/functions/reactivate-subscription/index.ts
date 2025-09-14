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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Processing reactivation for user:', user.id);

    // Get current subscription details
    const { data: subscription, error: fetchError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      throw new Error('Subscription not found');
    }

    // Check if subscription can be reactivated
    if (!subscription.cancel_at_period_end) {
      throw new Error('Subscription is not scheduled for cancellation');
    }

    // Check if we're still within the current period
    const periodEnd = subscription.period_end;
    if (periodEnd && new Date(periodEnd) <= new Date()) {
      throw new Error('Subscription period has already ended. Please create a new subscription.');
    }

    // Reactivate the subscription
    const updateData = {
      cancel_at_period_end: false,
      status: 'active',
      cancellation_reason: null, // Clear the cancellation reason
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error reactivating subscription:', updateError);
      throw updateError;
    }

    // In a real implementation, you would make an API call to Razorpay here to reactivate:
    // const razorpayResponse = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscription.razorpay_subscription_id}`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Authorization': `Basic ${btoa(Deno.env.get('RAZORPAY_KEY_ID') + ':' + Deno.env.get('RAZORPAY_KEY_SECRET'))}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     cancel_at_cycle_end: 0
    //   })
    // });

    console.log(`Reactivated subscription for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription reactivated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Reactivation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});