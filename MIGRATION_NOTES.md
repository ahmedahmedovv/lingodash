# Migration from localStorage to Supabase

## Summary of Changes

This document outlines all the changes made to migrate LingoDash from localStorage to Supabase cloud database.

## Files Modified

### 1. **New Files Created**

#### `src/js/supabase.js` (NEW)
- Supabase client initialization
- User ID generation and management
- Exports `supabase` client and `getUserId()` helper

#### `SUPABASE_SCHEMA.sql` (NEW)
- Database table schema
- Indexes for performance
- Row Level Security policies
- Triggers for automatic timestamp updates

#### `SUPABASE_SETUP.md` (NEW)
- Step-by-step setup instructions
- Troubleshooting guide
- Database query examples

### 2. **Files Updated**

#### `package.json`
- Added dependency: `@supabase/supabase-js`

#### `src/js/storage.js` (MAJOR CHANGES)
**Before**: Synchronous localStorage operations
**After**: Asynchronous Supabase database operations

Changes made:
- ✅ `getSavedWords()` → Now async, fetches from Supabase
- ✅ `saveWord()` → Now async, inserts/updates in Supabase
- ✅ `updateWordReview()` → Now async, updates review data in Supabase
- ✅ `getWordsDueForReview()` → Now async, queries due words from Supabase
- ✅ `deleteWord()` → Now async, deletes from Supabase
- ✅ `clearAllWords()` → Now async, deletes all user words from Supabase
- ✅ `exportWords()` → Now async (fetches from Supabase first)
- ➕ Added `cleanupOldWords()` helper to maintain 50-word limit

#### `src/js/lookup.js`
Changes made:
- Updated `saveWord()` call to use `await`
- Added loading state while saving ("💾 Saving...")
- Added error handling for failed saves
- Updated batch lookup auto-save to be async
- Better user feedback for save operations

#### `src/js/ui.js`
Changes made:
- `displaySavedWords()` → Now async with loading state
- Delete button handler updated to await `deleteWord()`
- Added error handling for failed operations
- Shows "Loading words..." while fetching

#### `src/js/exercise.js`
Changes made:
- `startExercise()` → Now async, fetches words from Supabase
- `checkAnswer()` → Now async, updates review data
- Added loading state while fetching words
- Better error handling for database operations

#### `src/main.js`
Changes made:
- Updated clear history button to await async operations
- All storage operations now properly awaited

## Technical Details

### Data Model Mapping

| localStorage Field | Supabase Column | Type |
|-------------------|-----------------|------|
| `word` | `word` | TEXT |
| `definition` | `definition` | TEXT |
| `example` | `example` | TEXT |
| `timestamp` | `timestamp` | TIMESTAMPTZ |
| `interval` | `interval` | INTEGER |
| `easeFactor` | `ease_factor` | DECIMAL(3,2) |
| `nextReview` | `next_review` | TIMESTAMPTZ |
| `reviewCount` | `review_count` | INTEGER |
| `correctCount` | `correct_count` | INTEGER |
| N/A | `user_id` | TEXT (new) |
| N/A | `id` | UUID (new) |

### User Identification

Instead of relying on browser localStorage to store all words, the app now:
1. Generates a unique `user_id` on first visit
2. Stores this ID in localStorage (`lingodash_user_id`)
3. Uses this ID to filter database queries

This enables:
- Multi-user support (each user sees only their words)
- Future authentication integration
- Data portability across devices (with proper auth)

### Performance Optimizations

1. **Database Indexes**: 
   - `idx_words_user_id` on `user_id`
   - `idx_words_user_word` on `(user_id, word)`
   - `idx_words_next_review` on `(user_id, next_review)`

2. **Efficient Queries**:
   - Limit 50 words per user (cleanup after insert)
   - Filter by user_id in all queries
   - Case-insensitive word comparison using `ilike`

3. **Async Operations**:
   - Non-blocking UI
   - Loading states for better UX
   - Error handling with graceful fallbacks

### Breaking Changes

⚠️ **Important**: The app no longer uses localStorage for word storage. Users with existing data should:

1. Export their words before migration (use Export button)
2. Clear browser cache if needed
3. Re-import words manually through lookup

## Testing Checklist

- [x] Save new word
- [x] Update existing word
- [x] Delete word
- [x] Clear all words
- [x] Export words (CSV/JSON)
- [x] Start exercise with words
- [x] Complete exercise and update review data
- [x] View saved words
- [x] Batch word lookup with auto-save
- [x] Handle duplicate words
- [x] 50-word limit enforcement

## Future Enhancements

### Recommended Next Steps

1. **Authentication**:
   - Implement Supabase Auth
   - Add user login/signup
   - Use `auth.uid()` instead of custom user_id

2. **Data Sync**:
   - Real-time updates with Supabase Realtime
   - Sync across multiple devices
   - Conflict resolution

3. **Backup/Restore**:
   - Automatic backups
   - Import from JSON/CSV
   - Restore deleted words

4. **Analytics**:
   - Track learning progress
   - View statistics dashboard
   - Export learning reports

## Support

For issues or questions:
1. Check browser console for errors
2. Review `SUPABASE_SETUP.md`
3. Verify database connection
4. Check Supabase dashboard logs

## Rollback Plan

If you need to rollback to localStorage:
1. Git checkout to previous commit
2. Run `npm install` to restore old dependencies
3. Your old localStorage data should still be intact
