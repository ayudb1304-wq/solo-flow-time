-- Fix the search_path security warning for the subscription maintenance function
CREATE OR REPLACE FUNCTION public.run_subscription_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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