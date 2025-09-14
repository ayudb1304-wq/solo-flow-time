-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to handle scheduled subscription maintenance
CREATE OR REPLACE FUNCTION public.run_subscription_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the subscription maintenance edge function
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/subscription-maintenance',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object('scheduled', true)
  );
END;
$$;

-- Schedule the subscription maintenance to run daily at midnight UTC
SELECT cron.schedule(
  'subscription-maintenance-daily',
  '0 0 * * *',
  'SELECT public.run_subscription_maintenance();'
);