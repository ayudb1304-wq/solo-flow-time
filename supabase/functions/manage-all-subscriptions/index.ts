import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionSummary {
  user_id: string;
  freelancer_name: string;
  currency: string;
  status: string;
  cancel_at_period_end: boolean;
  period_end: string | null;
  days_remaining: number | null;
  next_billing_date: string | null;
  subscription_summary: string;
  health_status: string;
  last_updated: string;
}

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

    // Get action from request body
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    console.log(`Subscription management action: ${action} by user: ${user.id}`);

    switch (action) {
      case 'list':
        return await listAllSubscriptions(supabaseClient);
      
      case 'fix_expired':
        return await fixExpiredSubscriptions(supabaseClient);
      
      case 'extend_trial':
        return await extendTrial(supabaseClient, body.user_id, body.days);
      
      case 'activate_pro':
        return await activatePro(supabaseClient, body.user_id);
      
      default:
        return await listAllSubscriptions(supabaseClient);
    }

  } catch (error) {
    console.error('Subscription management error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function listAllSubscriptions(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('user_subscriptions')
    .select(`
      user_id,
      status,
      cancel_at_period_end,
      period_end,
      created_at,
      updated_at,
      profiles!inner(freelancer_name, currency)
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const subscriptions: SubscriptionSummary[] = data.map((sub: any) => {
    const daysRemaining = sub.period_end 
      ? Math.ceil((new Date(sub.period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const healthStatus = 
      sub.status === 'active' && sub.period_end && new Date(sub.period_end) > new Date() ? 'ACTIVE' :
      sub.status === 'active' && sub.period_end && new Date(sub.period_end) <= new Date() ? 'EXPIRED' :
      sub.status === 'trial' ? 'TRIAL' :
      sub.status === 'cancelled' ? 'CANCELLED' : 'UNKNOWN';

    const summary = 
      sub.status === 'active' && !sub.cancel_at_period_end ? 'Active Pro - ₹799/month' :
      sub.status === 'active' && sub.cancel_at_period_end ? `Cancelling on ${new Date(sub.period_end || '').toLocaleDateString()}` :
      sub.status === 'trial' ? 'Free Trial' :
      sub.status === 'cancelled' ? 'Cancelled' :
      sub.status;

    return {
      user_id: sub.user_id,
      freelancer_name: sub.profiles.freelancer_name,
      currency: sub.profiles.currency || 'INR',
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      period_end: sub.period_end,
      days_remaining: daysRemaining,
      next_billing_date: sub.period_end ? new Date(sub.period_end).toLocaleDateString() : null,
      subscription_summary: summary,
      health_status: healthStatus,
      last_updated: sub.updated_at
    };
  });

  const summary = {
    total_users: subscriptions.length,
    active_pro: subscriptions.filter(s => s.health_status === 'ACTIVE').length,
    trial_users: subscriptions.filter(s => s.health_status === 'TRIAL').length,
    cancelled_users: subscriptions.filter(s => s.health_status === 'CANCELLED').length,
    expired_users: subscriptions.filter(s => s.health_status === 'EXPIRED').length,
    cancelling_soon: subscriptions.filter(s => s.cancel_at_period_end && s.health_status === 'ACTIVE').length
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      summary,
      subscriptions: subscriptions.sort((a, b) => {
        const statusOrder = { 'ACTIVE': 1, 'EXPIRED': 2, 'TRIAL': 3, 'CANCELLED': 4 };
        return (statusOrder[a.health_status as keyof typeof statusOrder] || 5) - 
               (statusOrder[b.health_status as keyof typeof statusOrder] || 5);
      })
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function fixExpiredSubscriptions(supabaseClient: any) {
  const { data: expiredSubs, error: fetchError } = await supabaseClient
    .from('user_subscriptions')
    .select('user_id, profiles!inner(freelancer_name)')
    .eq('status', 'active')
    .lt('period_end', new Date().toISOString());

  if (fetchError) throw fetchError;

  if (!expiredSubs || expiredSubs.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'No expired subscriptions found',
        fixed: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }

  const { error: updateError } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('status', 'active')
    .lt('period_end', new Date().toISOString());

  if (updateError) throw updateError;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Fixed ${expiredSubs.length} expired subscriptions`,
      fixed: expiredSubs.length,
      users: expiredSubs.map((sub: any) => sub.profiles.freelancer_name)
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function extendTrial(supabaseClient: any, userId: string, days: number = 30) {
  if (!userId || !days) {
    throw new Error('userId and days are required');
  }

  const newPeriodEnd = new Date();
  newPeriodEnd.setDate(newPeriodEnd.getDate() + days);

  const { error } = await supabaseClient
    .from('user_subscriptions')
    .update({
      period_end: newPeriodEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Extended trial for user by ${days} days`,
      new_period_end: newPeriodEnd.toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function activatePro(supabaseClient: any, userId: string) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error } = await supabaseClient
    .from('user_subscriptions')
    .update({
      status: 'active',
      cancel_at_period_end: false,
      period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Activated Pro subscription for user',
      period_end: periodEnd.toISOString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}