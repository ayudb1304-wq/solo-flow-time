-- Improve security of SECURITY DEFINER functions by adding proper access controls

-- 1. Update handle_new_user function with better security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow if this is being called during user creation
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No user context';
  END IF;
  
  -- Only create profile if one doesn't exist
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

-- 2. Update handle_oauth_user function with better security  
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow if this is being called during OAuth flow
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No user context';
  END IF;
  
  -- Only create profile if one doesn't exist
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

-- 3. Update manage_subscription_data function with access control
CREATE OR REPLACE FUNCTION public.manage_subscription_data()
RETURNS TABLE(user_id uuid, freelancer_name text, old_status text, new_status text, period_end timestamp with time zone, days_remaining integer, action_taken text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only allow service role to call this function
  IF auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Service role required';
  END IF;

  -- Return details of all subscription updates
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

-- 4. Update run_subscription_maintenance function with access control
CREATE OR REPLACE FUNCTION public.run_subscription_maintenance()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only allow service role to call this function
  IF auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Service role required';
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

-- 5. Add RLS policies to subscription_dashboard view
CREATE POLICY "Users can only view their own subscription dashboard"
ON user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Ensure RLS is enabled on the underlying tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;