-- Phase 1: Enhanced Database Schema Updates

-- Create subscription status ENUM for better data integrity
CREATE TYPE subscription_status_enum AS ENUM (
  'trial',
  'active', 
  'pending_cancellation',
  'cancelled',
  'past_due'
);

-- Add new columns to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN razorpay_subscription_id text UNIQUE,
ADD COLUMN cancellation_reason text,
ADD COLUMN temp_status subscription_status_enum;

-- Update temp_status based on existing subscription_status
UPDATE public.user_subscriptions 
SET temp_status = CASE 
  WHEN subscription_status = 'trial' THEN 'trial'::subscription_status_enum
  WHEN subscription_status = 'pro' THEN 'active'::subscription_status_enum
  ELSE 'trial'::subscription_status_enum
END;

-- Drop old column and rename new one
ALTER TABLE public.user_subscriptions 
DROP COLUMN subscription_status,
ADD COLUMN status subscription_status_enum NOT NULL DEFAULT 'trial';

-- Copy data from temp column
UPDATE public.user_subscriptions 
SET status = temp_status;

-- Drop temp column
ALTER TABLE public.user_subscriptions 
DROP COLUMN temp_status;

-- Rename columns for consistency
ALTER TABLE public.user_subscriptions 
RENAME COLUMN subscription_period_end TO period_end;

ALTER TABLE public.user_subscriptions 
RENAME COLUMN subscription_cancel_at_period_end TO cancel_at_period_end;

-- Add razorpay_customer_id to user_payment_profiles table
ALTER TABLE public.user_payment_profiles 
ADD COLUMN razorpay_customer_id text;

-- Add indexes for better performance
CREATE INDEX idx_user_subscriptions_razorpay_id ON public.user_subscriptions(razorpay_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_payment_profiles_razorpay ON public.user_payment_profiles(razorpay_customer_id);