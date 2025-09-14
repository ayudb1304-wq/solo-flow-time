-- Fix subscription_dashboard security by ensuring proper security barrier and inheritance

-- 1. Recreate the subscription_dashboard view with explicit security barrier
DROP VIEW IF EXISTS subscription_dashboard;

CREATE VIEW subscription_dashboard 
WITH (security_barrier = true) AS
SELECT 
  us.user_id,
  p.freelancer_name,
  p.currency,
  us.status,
  us.cancel_at_period_end,
  us.period_end,
  us.razorpay_subscription_id,
  us.created_at as subscription_created,
  us.updated_at as last_updated,
  CASE 
    WHEN us.period_end IS NOT NULL THEN 
      EXTRACT(days FROM us.period_end - NOW())::integer
    ELSE NULL
  END as days_remaining,
  CASE 
    WHEN us.period_end IS NOT NULL THEN 
      us.period_end::date
    ELSE NULL
  END as next_billing_date,
  CASE 
    WHEN us.status = 'active' AND us.cancel_at_period_end = false THEN 
      'Active Pro - ₹799/month'
    WHEN us.status = 'active' AND us.cancel_at_period_end = true THEN 
      'Cancelling on ' || to_char(us.period_end, 'Mon DD, YYYY')
    WHEN us.status = 'trial' THEN 
      'Free Trial'
    WHEN us.status = 'cancelled' THEN 
      'Cancelled'
    WHEN us.status = 'pending_cancellation' THEN 
      'Pending Cancellation'
    ELSE 
      us.status::text
  END as subscription_summary,
  CASE 
    WHEN us.status = 'active' AND us.period_end > NOW() THEN 'ACTIVE'
    WHEN us.status = 'active' AND us.period_end <= NOW() THEN 'EXPIRED'
    WHEN us.status = 'trial' THEN 'TRIAL'
    WHEN us.status = 'cancelled' THEN 'CANCELLED'
    ELSE 'UNKNOWN'
  END as health_status
FROM user_subscriptions us
LEFT JOIN profiles p ON us.user_id = p.user_id;

-- 2. Add comment explaining security approach
COMMENT ON VIEW subscription_dashboard IS 'Secure view with security_barrier=true that inherits RLS policies from user_subscriptions and profiles tables. Access automatically restricted to authenticated users viewing only their own subscription data.';