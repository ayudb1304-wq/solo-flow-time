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

    // Plan configurations
    const plans = {
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
      },
      business: {
        amount: 159900, // ₹1599 in paise
        period: 'monthly', 
        interval: 1,
        item: {
          name: 'SoloFlow Business Plan',
          description: 'Everything in Pro + multi-user, integrations, priority support',
          amount: 159900,
          currency: 'INR',
        }
      }
    };

    const selectedPlan = plans[planId as keyof typeof plans];
    if (!selectedPlan) {
      throw new Error('Invalid plan selected');
    }

    // Create Razorpay subscription
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const subscriptionResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: selectedPlan,
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