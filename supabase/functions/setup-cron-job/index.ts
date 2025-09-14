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

    console.log('Setting up daily subscription maintenance cron job...');

    // Schedule the subscription maintenance function to run daily at midnight UTC
    const { data, error } = await supabaseClient.rpc('cron.schedule', {
      jobname: 'subscription-maintenance-daily',
      schedule: '0 0 * * *', // Daily at midnight UTC
      command: `
        SELECT net.http_post(
          url := '${Deno.env.get('SUPABASE_URL')}/functions/v1/subscription-maintenance',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
          body := '{"scheduled": true}'::jsonb
        );
      `
    });

    if (error) {
      console.error('Error setting up cron job:', error);
      throw error;
    }

    console.log('Cron job setup completed successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily subscription maintenance cron job has been set up',
        data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Setup cron job error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});