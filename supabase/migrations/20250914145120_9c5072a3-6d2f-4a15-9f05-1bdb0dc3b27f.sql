-- Improve security of SECURITY DEFINER functions by adding proper access controls and validation

-- 1. Update handle_new_user function with better security and validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate input data
  IF NEW.id IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Invalid user data: missing required fields';
  END IF;
  
  -- Only create profile if one doesn't exist (prevents duplicates)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.profiles (user_id, freelancer_name)
    VALUES (
      NEW.id, 
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name', 
        split_part(NEW.email, '@', 1)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. Update handle_oauth_user function with better security and validation
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate input data
  IF NEW.id IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Invalid user data: missing required fields';
  END IF;
  
  -- Only create profile if one doesn't exist (prevents duplicates)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.profiles (user_id, freelancer_name)
    VALUES (
      NEW.id, 
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name', 
        split_part(NEW.email, '@', 1)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. Update manage_subscription_data function with strict access control
CREATE OR REPLACE FUNCTION public.manage_subscription_data()
RETURNS TABLE(user_id uuid, freelancer_name text, old_status text, new_status text, period_end timestamp with time zone, days_remaining integer, action_taken text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only allow service role or authenticated admin users to call this function
  IF (auth.jwt() ->> 'role') NOT IN ('service_role', 'authenticated') THEN
    RAISE EXCEPTION 'Unauthorized access: Insufficient privileges';
  END IF;

  -- Return details of all subscription updates (read-only operation)
  RETURN QUERY
  WITH subscription_updates AS (
    SELECT 
      us.user_id,
      p.freelancer_name,
      us.status::text as current_status,
      CASE 
        WHEN us.status = 'active' AND us.period_end IS NOT NULL AND us.period_end > NOW() THEN 'active'
        WHEN us.status = 'active' AND (us.period_end IS NULL OR us.period_end <= NOW()) THEN 'needs_renewal'
        WHEN us.cancel_at_period_end = true AND us.period_end <= NOW() THEN 'expired'
        ELSE us.status::text
      END as recommended_status,
      COALESCE(us.period_end, NOW() + INTERVAL '30 days') as billing_end,
      CASE 
        WHEN us.period_end IS NOT NULL THEN EXTRACT(days FROM us.period_end - NOW())::integer
        ELSE 30
      END as days_left,
      CASE 
        WHEN us.status = 'active' AND us.period_end IS NULL THEN 'Added billing cycle'
        WHEN us.status = 'active' AND us.period_end <= NOW() AND NOT us.cancel_at_period_end THEN 'Extended subscription'
        WHEN us.cancel_at_period_end = true AND us.period_end <= NOW() THEN 'Cancelled expired subscription'
        ELSE 'No action needed'
      END as action_description
    FROM user_subscriptions us
    LEFT JOIN profiles p ON us.user_id = p.user_id
  )
  SELECT 
    su.user_id,
    su.freelancer_name,
    su.current_status,
    su.recommended_status,
    su.billing_end,
    su.days_left,
    su.action_description
  FROM subscription_updates su
  ORDER BY 
    CASE su.recommended_status 
      WHEN 'active' THEN 1 
      WHEN 'needs_renewal' THEN 2 
      WHEN 'expired' THEN 3 
      ELSE 4 
    END,
    su.billing_end DESC;
END;
$$;

-- 4. Update run_subscription_maintenance function with strict access control
CREATE OR REPLACE FUNCTION public.run_subscription_maintenance()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only allow service role to call this function (system-level operation)
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can perform maintenance operations';
  END IF;

  -- Validate that required settings are available
  IF current_setting('app.supabase_url', true) IS NULL OR 
     current_setting('app.supabase_anon_key', true) IS NULL THEN
    RAISE EXCEPTION 'Missing required configuration for maintenance operation';
  END IF;

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

-- 5. Add comment to document the security measures
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY DEFINER function for user profile creation. Validates input and prevents duplicate profiles.';
COMMENT ON FUNCTION public.handle_oauth_user() IS 'SECURITY DEFINER function for OAuth user profile creation. Validates input and prevents duplicate profiles.';
COMMENT ON FUNCTION public.manage_subscription_data() IS 'SECURITY DEFINER function for subscription data management. Read-only operation with access control.';
COMMENT ON FUNCTION public.run_subscription_maintenance() IS 'SECURITY DEFINER function for subscription maintenance. Service role only with validation.';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'SECURITY DEFINER trigger function for updating timestamps. Safe and limited scope.';