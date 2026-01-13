# Database Setup Guide

Complete setup instructions for the Supabase database required by LingoDash.

## Overview

LingoDash uses Supabase as its cloud database to store user vocabulary and spaced repetition data. The database schema includes a single `words` table with all necessary fields for the learning system.

## Option 1: Use Existing Supabase Project (Recommended)

The quickest way to get started is to use the existing Supabase project:

### Steps

1. **Access the Supabase Dashboard**
   - Go to: https://yjlsfkhtulxmpdpihgpz.supabase.co
   - You may need to request access from the project owner

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" to create a new SQL tab

3. **Run the Schema**
   - Copy the entire contents of `SUPABASE_SCHEMA.sql` from your project
   - Paste it into the SQL Editor
   - Click "Run" to execute the SQL

4. **Verify Setup**
   - Go to "Table Editor" in the left sidebar
   - Confirm you see a `words` table
   - Check that all columns are present (id, user_id, word, definition, etc.)

## Option 2: Create Your Own Supabase Project

If you prefer to create your own Supabase project:

### 1. Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Verify your email

### 2. Create New Project

1. Click "New Project" in your dashboard
2. Fill in project details:
   - **Name**: `lingodash` (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users

3. Wait for project creation (usually 2-3 minutes)

### 3. Set Up Database Schema

1. Once created, go to your project dashboard
2. Click "SQL Editor" in the left sidebar
3. Copy and paste the contents of `SUPABASE_SCHEMA.sql`
4. Click "Run" to create the table and policies

### 4. Configure Environment Variables

1. In your project, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL**
   - **anon/public key**

3. Create or update your `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Update `src/js/supabase.js` to use environment variables:

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**⚠️ Security Note**: Never commit `.env` files to version control. They should already be in `.gitignore`.

## Database Schema Details

### Words Table Structure

```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Spaced repetition fields
  interval INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.50,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,

  -- Constraints
  UNIQUE(user_id, LOWER(word))
);
```

### Field Descriptions

- **id**: Unique identifier for each word entry
- **user_id**: Identifies the user (currently using localStorage-generated ID)
- **word**: The vocabulary word (stored in lowercase for uniqueness)
- **definition**: AI-generated definition from Mistral API
- **example**: Example sentence showing word usage
- **timestamp**: When the word was first saved

**Spaced Repetition Fields:**
- **interval**: Days until next review (0 = immediate)
- **ease_factor**: Difficulty multiplier (2.50 default, adjusts based on performance)
- **next_review**: Scheduled review date
- **review_count**: Total times reviewed
- **correct_count**: Total correct answers

### Security Policies

The schema includes Row Level Security (RLS) policies:

```sql
-- Enable RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own words
CREATE POLICY "Users can view their own words" ON words
    FOR SELECT USING (user_id = current_setting('app.user_id')::text);

CREATE POLICY "Users can insert their own words" ON words
    FOR INSERT WITH CHECK (user_id = current_setting('app.user_id')::text);

CREATE POLICY "Users can update their own words" ON words
    FOR UPDATE USING (user_id = current_setting('app.user_id')::text);

CREATE POLICY "Users can delete their own words" ON words
    FOR DELETE USING (user_id = current_setting('app.user_id')::text);
```

**Note**: The current implementation uses a simplified user_id system. For production use, consider implementing proper Supabase Auth.

## Indexes for Performance

The schema includes optimized indexes:

```sql
-- Fast user queries
CREATE INDEX idx_words_user_id ON words(user_id);

-- Compound index for duplicate checking
CREATE INDEX idx_words_user_word ON words(user_id, LOWER(word));

-- Exercise scheduling optimization
CREATE INDEX idx_words_next_review ON words(user_id, next_review);
```

## Testing Database Connection

After setup, test your database connection:

1. Start the development server: `npm run dev`
2. Open the app in your browser
3. Try looking up and saving a word
4. Check the browser's Network tab for any errors
5. Verify words appear in Supabase's Table Editor

## Troubleshooting

### Common Issues

**Table Not Created**
- Double-check that you ran the entire SQL script
- Look for error messages in the SQL Editor
- Try running smaller portions of the script individually

**Connection Errors**
- Verify your project URL and API key are correct
- Check that your Supabase project is active (not paused)
- Ensure your firewall allows connections to Supabase

**RLS Policy Errors**
- Make sure RLS is enabled on the table
- Verify the user_id is being set correctly in your app
- Check the browser console for policy violation errors

**Performance Issues**
- Ensure indexes were created successfully
- Monitor query performance in Supabase's Query Performance dashboard

### Getting Help

- Check Supabase's [documentation](https://supabase.com/docs)
- Review browser console errors
- Test database queries directly in Supabase's SQL Editor

## Migration Notes

If you're migrating from localStorage to Supabase, see the migration guide in the development documentation.
