-- Fix subscription_dashboard security by enabling RLS and adding proper policies

-- 1. Enable RLS on the subscription_dashboard view
ALTER VIEW subscription_dashboard SET (security_barrier = true);
ALTER VIEW subscription_dashboard ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for the subscription_dashboard view
-- Policy to allow users to only see their own subscription data
CREATE POLICY "Users can only view their own subscription data"
ON subscription_dashboard FOR SELECT
TO public
USING (user_id = auth.uid());

-- 3. Create a policy for service roles to access all subscription data for admin purposes
CREATE POLICY "Service role can view all subscription data"
ON subscription_dashboard FOR SELECT
TO public  
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'role' = 'authenticated' AND user_id = auth.uid())
);

-- 4. Drop the old policy if it exists (this is safer than trying to avoid duplicates)
DROP POLICY IF EXISTS "Users can only view their own subscription data" ON subscription_dashboard;

-- 5. Re-create the correct policy
CREATE POLICY "Users can only view their own subscription data"
ON subscription_dashboard FOR SELECT
TO public
USING (user_id = auth.uid());

-- 6. Add a comment to document the security measure
COMMENT ON VIEW subscription_dashboard IS 'View with RLS enabled to ensure users can only access their own subscription data. Contains sensitive billing and payment information.';