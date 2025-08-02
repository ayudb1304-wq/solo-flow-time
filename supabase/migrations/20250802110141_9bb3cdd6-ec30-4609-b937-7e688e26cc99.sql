-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', false);

-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('file', 'link')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER, -- For files only, in bytes
  mime_type TEXT, -- For files only
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_attachments
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for task_attachments
CREATE POLICY "Users can view their own task attachments" 
ON public.task_attachments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own task attachments" 
ON public.task_attachments 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own task attachments" 
ON public.task_attachments 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own task attachments" 
ON public.task_attachments 
FOR DELETE 
USING (user_id = auth.uid());

-- Create storage policies for task-attachments bucket
CREATE POLICY "Users can view their own task files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own task files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own task files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own task files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_attachments_updated_at
BEFORE UPDATE ON public.task_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();