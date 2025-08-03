import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planId, userId } = await req.json();

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not found');
    }

    // Plan configurations with amounts for creating plans dynamically
    const planConfigs = {
      pro: {
        amount: 79900, // ₹799 in paise
        period: 'monthly',
        interval: 1,
        item: {
          name: 'SoloFlow Pro Plan',
          description: 'Unlimited clients & projects, advanced invoicing',
          amount: 79900,
          currency: 'INR',
        }
      }
    };

    const selectedPlanConfig = planConfigs[planId as keyof typeof planConfigs];
    if (!selectedPlanConfig) {
      throw new Error('Invalid plan selected');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    // First create a plan in Razorpay
    const planResponse = await fetch('https://api.razorpay.com/v1/plans', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period: selectedPlanConfig.period,
        interval: selectedPlanConfig.interval,
        item: selectedPlanConfig.item
      }),
    });

    if (!planResponse.ok) {
      const error = await planResponse.text();
      throw new Error(`Razorpay Plan creation error: ${error}`);
    }

    const plan = await planResponse.json();
    
    // Now create a subscription using the plan ID
    const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.id,
        customer_notify: 1,
        quantity: 1,
        total_count: 12, // 12 months
        addons: [],
        notes: {
          user_id: userId,
          plan: planId,
        }
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      throw new Error(`Razorpay API error: ${error}`);
    }

    const subscription = await subscriptionResponse.json();

    return new Response(
      JSON.stringify({
        subscription_id: subscription.id,
        short_url: subscription.short_url,
        status: subscription.status,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});