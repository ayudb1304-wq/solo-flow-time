-- Configure Google OAuth provider
-- This migration sets up Google OAuth integration

-- Enable the Google provider (this is done via the Supabase Dashboard)
-- The following are the required settings for Google OAuth:

-- 1. Google OAuth Client ID should be added to Supabase Auth settings
-- 2. Google OAuth Client Secret should be added to Supabase Auth settings  
-- 3. Redirect URLs should include:
--    - https://mkhqhlrxkabqqmzgzhwx.supabase.co/auth/v1/callback
--    - Your domain/app URL for local development and production

-- This migration creates any necessary database changes for OAuth support
-- The actual OAuth provider configuration is done in the Supabase Dashboard

-- Add any additional user identity tracking if needed
-- The auth.identities table already exists in Supabase for OAuth providers

-- Add a function to handle OAuth user profile creation if needed
CREATE OR REPLACE FUNCTION public.handle_oauth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Check if profile already exists
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
$function$;

-- Create trigger for OAuth users (replaces the existing one to handle both email and OAuth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_oauth_user();