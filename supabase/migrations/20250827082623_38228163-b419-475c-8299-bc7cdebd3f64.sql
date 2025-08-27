-- Add logo_url and brand_color columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN logo_url TEXT,
ADD COLUMN brand_color TEXT;

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true);

-- Create storage policies for logo uploads
CREATE POLICY "Users can view their own logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);