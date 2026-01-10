# Supabase Setup Guide for LingoDash

This guide will help you set up the Supabase database for your LingoDash vocabulary learning app.

## What Changed

✅ **Migrated from localStorage to Supabase**
- All vocabulary words are now saved to a cloud database
- Data persists across devices and browsers
- Better scalability and data management
- Multi-user support with unique user IDs

## Step 1: Create the Database Table

1. Go to your Supabase dashboard: https://yjlsfkhtulxmpdpihgpz.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Create a **New Query**
4. Copy and paste the entire contents of `SUPABASE_SCHEMA.sql` file
5. Click **Run** to execute the SQL commands

This will create:
- The `words` table with all necessary columns
- Indexes for better performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

## Step 2: Verify the Table Creation

1. Navigate to **Table Editor** in the left sidebar
2. You should see a new table called `words`
3. Click on it to view its structure

Expected columns:
- `id` (UUID, Primary Key)
- `user_id` (TEXT)
- `word` (TEXT)
- `definition` (TEXT)
- `example` (TEXT)
- `timestamp` (TIMESTAMPTZ)
- `interval` (INTEGER)
- `ease_factor` (DECIMAL)
- `next_review` (TIMESTAMPTZ)
- `review_count` (INTEGER)
- `correct_count` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Step 3: Run the Application

```bash
npm run dev
```

The app will automatically:
- Generate a unique user ID on first visit (stored in localStorage)
- Use this user ID to save/retrieve words from Supabase
- Handle all database operations asynchronously

## How It Works

### User Identification
Each user gets a unique ID (e.g., `user_abc123def456`) that's generated on their first visit and stored in their browser's localStorage. This ID is used to separate each user's vocabulary data in the database.

### Data Storage
- **Save Word**: When you save a word, it's immediately sent to Supabase
- **Get Words**: Words are fetched from Supabase when you view the saved words tab
- **Update Review**: Spaced repetition data is updated in real-time
- **Delete Word**: Words are permanently removed from the database

### Key Features
1. **Cloud Sync**: All data is stored in the cloud
2. **Spaced Repetition**: Learning algorithm data is preserved
3. **50 Word Limit**: Automatically maintains only your 50 most recent words
4. **Fast Operations**: Optimized queries with database indexes
5. **Error Handling**: Graceful fallbacks if database is unavailable

## Troubleshooting

### Words not saving?
1. Check your browser console for errors
2. Verify the Supabase credentials in `src/js/supabase.js`
3. Ensure the `words` table was created successfully

### Connection errors?
1. Verify your Supabase project URL is correct
2. Check that your API key has the right permissions
3. Make sure Row Level Security policies are set correctly

### Migration from localStorage
If you had words saved in localStorage before:
1. Export your words using the Export button (JSON format)
2. The old localStorage data will remain but won't be used
3. You can manually re-add important words through the lookup feature

## Advanced: Enable Proper Authentication

For production use, you should implement Supabase Authentication:

1. Enable Email/Password auth in Supabase Dashboard
2. Update `src/js/supabase.js` to use `supabase.auth.signUp()` and `supabase.auth.signIn()`
3. Replace `getUserId()` with `supabase.auth.user()?.id`
4. Update RLS policies to use `auth.uid()` instead of permissive policies

## Database Queries

View all your words in SQL Editor:
```sql
SELECT * FROM words ORDER BY timestamp DESC;
```

Count words per user:
```sql
SELECT user_id, COUNT(*) as word_count 
FROM words 
GROUP BY user_id;
```

Find words due for review:
```sql
SELECT word, next_review 
FROM words 
WHERE next_review <= NOW() 
ORDER BY next_review;
```

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Check browser console for detailed error messages
- Verify all SQL commands ran successfully in the SQL Editor
