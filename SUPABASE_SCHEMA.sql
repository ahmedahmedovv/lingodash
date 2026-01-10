-- Database Schema for LingoDash
-- Run this SQL in your Supabase SQL Editor to create the necessary table

-- Create the words table
CREATE TABLE IF NOT EXISTS words (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Spaced repetition fields
    interval INTEGER DEFAULT 0,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    next_review TIMESTAMPTZ DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    
    -- Indexes for better query performance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id and word for faster lookups
CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
CREATE INDEX IF NOT EXISTS idx_words_user_word ON words(user_id, word);
CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(user_id, next_review);

-- Create unique constraint to prevent duplicate words per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_words_user_word_unique ON words(user_id, LOWER(word));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for multi-user support
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own words
-- Note: Since we're using a custom user_id field (not Supabase auth), 
-- we'll create a permissive policy for now. 
-- For production, you should implement proper Supabase authentication.

CREATE POLICY "Users can view their own words" ON words
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own words" ON words
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own words" ON words
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own words" ON words
    FOR DELETE USING (true);
