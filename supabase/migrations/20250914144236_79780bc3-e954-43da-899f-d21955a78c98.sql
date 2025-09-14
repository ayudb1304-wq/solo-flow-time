-- Fix and standardize all subscription data
-- Update active subscriptions without period_end to have proper billing cycles
UPDATE user_subscriptions 
SET 
  period_end = CASE 
    WHEN period_end IS NULL AND status = 'active' THEN 
      (NOW() + INTERVAL '30 days')::timestamptz
    ELSE period_end 
  END,
  updated_at = NOW()
WHERE status = 'active' AND (period_end IS NULL OR period_end < NOW());

-- Expire any active subscriptions that should have ended
UPDATE user_subscriptions 
SET 
  status = 'cancelled',
  cancel_at_period_end = false,
  updated_at = NOW()
WHERE status = 'active' 
  AND cancel_at_period_end = true 
  AND period_end IS NOT NULL 
  AND period_end <= NOW();

-- Create a comprehensive subscription management function
CREATE OR REPLACE FUNCTION public.manage_subscription_data()
RETURNS TABLE(
  user_id uuid,
  freelancer_name text,
  old_status text,
  new_status text,
  period_end timestamptz,
  days_remaining integer,
  action_taken text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
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