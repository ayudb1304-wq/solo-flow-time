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
    console.log('Starting subscription creation process');
    const { planId, userId } = await req.json();
    console.log('Received request:', { planId, userId });

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not found');
      throw new Error('Razorpay credentials not found');
    }
    console.log('Razorpay credentials verified');

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
      console.error('Invalid plan selected:', planId);
      throw new Error('Invalid plan selected');
    }
    console.log('Selected plan config:', selectedPlanConfig);

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    // First create a plan in Razorpay
    console.log('Creating plan in Razorpay...');
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

    console.log('Plan response status:', planResponse.status);
    if (!planResponse.ok) {
      const error = await planResponse.text();
      console.error('Razorpay Plan creation error:', error);
      throw new Error(`Razorpay Plan creation error: ${error}`);
    }

    const plan = await planResponse.json();
    console.log('Plan created successfully:', plan.id);
    
    // Now create a subscription using the plan ID
    console.log('Creating subscription with plan ID:', plan.id);
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

    console.log('Subscription response status:', subscriptionResponse.status);
    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('Razorpay subscription creation error:', error);
      throw new Error(`Razorpay API error: ${error}`);
    }

    const subscription = await subscriptionResponse.json();
    console.log('Subscription created successfully:', {
      id: subscription.id,
      status: subscription.status,
      short_url: subscription.short_url
    });

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
    console.error('Error in create-razorpay-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error message:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});