-- Add needs_review column to time_entries table for flagging inactive periods
ALTER TABLE public.time_entries
ADD COLUMN needs_review BOOLEAN DEFAULT false;