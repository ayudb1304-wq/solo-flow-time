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

    console.log('Starting subscription maintenance job...');

    // Find subscriptions that should be cancelled
    const { data: expiredSubscriptions, error: fetchError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('cancel_at_period_end', true)
      .not('period_end', 'is', null)
      .lte('period_end', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredSubscriptions?.length || 0} expired subscriptions to process`);

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired subscriptions to process',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let processed = 0;
    const results = [];

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription to cancelled status
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
          results.push({
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            success: false,
            error: updateError.message
          });
          continue;
        }

        // TODO: Send final cancellation email
        // await supabaseClient.functions.invoke('send-cancellation-email', {
        //   body: {
        //     user_id: subscription.user_id,
        //     cancellation_reason: subscription.cancellation_reason
        //   }
        // });

        processed++;
        results.push({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          success: true
        });

        console.log(`Successfully cancelled subscription for user ${subscription.user_id}`);

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.push({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Subscription maintenance completed. Processed: ${processed}/${expiredSubscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processed} expired subscriptions`,
        processed,
        total: expiredSubscriptions.length,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Subscription maintenance error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});