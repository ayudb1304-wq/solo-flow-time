-- Add currency preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'));