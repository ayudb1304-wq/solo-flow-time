-- Add subscription cancellation fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_cancel_at_period_end boolean DEFAULT false,
ADD COLUMN subscription_period_end timestamp with time zone;