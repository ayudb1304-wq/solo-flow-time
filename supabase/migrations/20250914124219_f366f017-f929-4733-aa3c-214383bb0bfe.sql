-- Add email verification status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token TEXT,
ADD COLUMN email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Create email verification tokens table for secure token management
CREATE TABLE public.email_verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email verification tokens
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for email verification tokens
CREATE POLICY "Users can view their own verification tokens"
ON public.email_verification_tokens
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all verification tokens"
ON public.email_verification_tokens
FOR ALL
USING (true);

-- Create trigger for timestamp updates
CREATE TRIGGER update_email_verification_tokens_updated_at
BEFORE UPDATE ON public.email_verification_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster token lookups
CREATE INDEX idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);