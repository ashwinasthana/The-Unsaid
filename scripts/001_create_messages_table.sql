-- Create the messages table for storing unsent messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on recipient_name for faster searches
CREATE INDEX IF NOT EXISTS idx_messages_recipient_name ON public.messages(recipient_name);

-- Create an index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (since this is an anonymous message board)
-- Allow anyone to read messages
CREATE POLICY "Allow public read access" ON public.messages
  FOR SELECT USING (true);

-- Allow anyone to insert messages (anonymous submissions)
CREATE POLICY "Allow public insert access" ON public.messages
  FOR INSERT WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
