-- Security Enhancement: Separate sensitive data from profiles table

-- Create user_subscriptions table for subscription data
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  subscription_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_payment_profiles table for payment/stripe data
CREATE TABLE public.user_payment_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions (users can only access their own data)
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create restrictive RLS policies for user_payment_profiles (more restricted access)
CREATE POLICY "Users can view their own payment profile" 
ON public.user_payment_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only service role can manage payment profiles for security
CREATE POLICY "Service role can manage payment profiles" 
ON public.user_payment_profiles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Migrate existing subscription data from profiles to user_subscriptions
INSERT INTO public.user_subscriptions (user_id, subscription_status, subscription_cancel_at_period_end, subscription_period_end)
SELECT 
  user_id, 
  COALESCE(subscription_status, 'trial'),
  COALESCE(subscription_cancel_at_period_end, false),
  subscription_period_end
FROM public.profiles
WHERE user_id IS NOT NULL;

-- Migrate existing stripe data from profiles to user_payment_profiles  
INSERT INTO public.user_payment_profiles (user_id, stripe_customer_id)
SELECT user_id, stripe_customer_id
FROM public.profiles
WHERE user_id IS NOT NULL AND stripe_customer_id IS NOT NULL;

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_payment_profiles_updated_at
BEFORE UPDATE ON public.user_payment_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove sensitive fields from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_cancel_at_period_end,
DROP COLUMN IF EXISTS subscription_period_end,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS email_verification_token,
DROP COLUMN IF EXISTS email_verification_expires_at,
DROP COLUMN IF EXISTS email_verified;