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

    console.log('Scheduling subscription cancellation for user:', user.id);

    // Calculate period end (30 days from now for testing)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // In test mode, we'll schedule cancellation at period end
    // In production, you would call Razorpay API to schedule cancellation
    const { error } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        subscription_cancel_at_period_end: true,
        subscription_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error scheduling cancellation:', error);
      throw error;
    }

    console.log(`Scheduled cancellation for user ${user.id} at period end`);

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription scheduled for cancellation at period end' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Cancellation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});