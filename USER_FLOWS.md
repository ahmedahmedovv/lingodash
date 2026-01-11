# LingoDash User Flow Analysis

## Overview
This document provides a comprehensive analysis of what happens when users interact with the LingoDash vocabulary learning application. Every user action is traced from the UI event through to database operations and UI updates.

## 1. App Initialization & Authentication

### **User opens the app**
1. **DOM Content Loaded** → `main.js:initApp()`
   - Initialize authentication UI components (`initAuthUI()`)
   - Check initial auth state with `getCurrentUser()`
   - Set up auth state change listeners with `onAuthStateChange()`

2. **If user is authenticated** → `initAppFeaturesOnce()`
   - Initialize tab navigation (`initTabs()`)
   - Initialize word lookup functionality (`initLookup()`)
   - Initialize saved words filters (`initFilterControls()`)
   - Display saved words list (`displaySavedWords()`)
   - Initialize exercise functionality (`initExercise()`)
   - **Background**: Pre-fetch exercise data (`prefetchExerciseData()`) for instant loading

3. **If user is NOT authenticated** → Show auth UI
   - Display sign-in/sign-up tabs with forms
   - User must authenticate before accessing app features

### **User signs up**
1. **Form submission** → `main.js:signupFormElement.addEventListener('submit')`
   - Validate email/password inputs
   - Show "Creating account..." loading state, disable submit button
   - Call `auth.js:signUp(email, password)`
   - Supabase creates new user account
   - **Success**: Show success message ("Account created! Please sign in."), switch to sign-in tab, clear form
   - **Error**: Display error message with custom styling, re-enable form

### **User signs in**
1. **Form submission** → `main.js:signinFormElement.addEventListener('submit')`
   - Validate email/password inputs
   - Show "Signing in..." loading state, disable submit button
   - Call `auth.js:signIn(email, password)`
   - Supabase authenticates user
   - **Success**: Hide auth UI, show app UI, display user email, initialize features (`initAppFeaturesOnce()`)
   - **Error**: Display error message with custom styling, re-enable form

### **User signs out**
1. **Logout button click** → `main.js:logoutBtn.addEventListener('click')`
   - Call `auth.js:signOut()`
   - Clear Supabase session
   - Reset app state (`appFeaturesInitialized = false`)
   - Show authentication UI

## 2. Tab Navigation

### **User clicks any tab (📚, 🔍, 🎯)**
1. **Tab click** → `ui.js:initTabs()`
   - Remove active class from all tabs and panels
   - Add active class to clicked tab and corresponding panel
   - **Special case for Saved Words tab**: When switching TO saved words tab → `displaySavedWords()` is called to load data

## 3. Word Lookup (🔍 Tab)

### **User types word and presses Enter**
1. **Enter key press** → `lookup.js:initLookup()`
   - Get trimmed word from input
   - Show definition box with "Looking up definition..." loading state
   - Call `api.js:getWordDefinition(word)`

2. **API lookup process** → `api.js:getWordDefinition()`
   - **First**: Check Supabase cache (`getWordIfExists()`) - instant if found
   - **If not cached**: Call Mistral AI API for definition with rate limiting (1 second between AI requests)
   - Retry logic: Built-in error handling for network/API issues

3. **Display results** → `lookup.js:lookupWord()`
   - Hide loading state
   - Show word definition and example
   - Indicate source: "✓ This word is already in your collection" (cached) or "🆕 New word fetched from AI" (new)
   - Show appropriate save button: "✓ Already Saved (Update)" or "💾 Save Word"

### **User clicks Save Word button**
1. **Save button click** → `lookup.js:lookupWord()` → save button event listener
   - Show "💾 Saving..." state, disable button
   - Call `storage.js:saveWord(word, definition, example)`
   - Check if word exists in Supabase (handles duplicates by updating)
   - **Success**: Show "✓ Saved!" with green styling, update saved words list if tab is visible, auto-reset after 2 seconds
   - **Error**: Show "❌ Error" with red styling, auto-reset after 2 seconds

### **User switches to batch mode**
1. **Batch mode button click** → `lookup.js:initBatchMode()`
   - Toggle between single and batch mode UI
   - Single mode: Shows input field and definition display
   - Batch mode: Shows textarea and batch results area

### **User pastes words and clicks Batch Lookup**
1. **Batch lookup button click** → `lookup.js:batchLookup()`
   - Parse textarea content into word array (split by newlines, trim each)
   - Show progress: "Looking up X word(s)..."
   - Disable button during processing
   - Call `api.js:getBatchWordDefinitions(words, progressCallback, autoSaveCallback)`

2. **Batch processing** → `api.js:getBatchWordDefinitions()`
   - Process words sequentially with rate limiting (1 second between AI calls)
   - For each word: Check Supabase cache first, then AI if needed
   - Progress updates: "Checking word X/Y: 'word'...", "Reusing 'word' from collection", "Fetching 'word' from AI"
   - Auto-save: Each successful lookup automatically calls `saveWord()` (unless already cached)
   - Handle failures gracefully per word

3. **Display batch results** → `lookup.js:displayBatchResults()`
   - Show result cards for each word (successful or failed)
   - Indicate source: "✓ From Collection" (cached) or "🆕 New" (AI-fetched)
   - Show summary: "✅ X new words saved, Y words reused from collection" or variations
   - Add "Clear Results" button to reset the view

## 4. Saved Words Management (📚 Tab)

### **Tab loads/refreshes**
1. **Tab activation** → `ui.js:initTabs()` → `displaySavedWords()`
   - Show "Loading words..." state
   - Call `storage.js:getSavedWordsPaginated(page, limit, filter)` with parallel count/data queries

2. **Database query** → `storage.js:getSavedWordsPaginated()`
   - Apply filter conditions (all/new/learning/mastered/due) based on spaced repetition data
   - Paginate results (50 words per page)
   - Sort by timestamp (newest first)

3. **Display results** → `ui.js:displaySavedWords()`
   - Hide loading state
   - Render word cards with status badges (New/Learning/Mastered/Overdue)
   - Show pagination controls with smart ellipsis
   - Attach event listeners to edit/delete buttons

### **User clicks filter button (All/New/Learning/Mastered/Due)**
1. **Filter button click** → `ui.js:initFilterControls()`
   - Update active filter state and button styling
   - Reset to page 1
   - Call `displaySavedWords(1, newFilter)` with scroll to top

### **User clicks pagination button**
1. **Page button click** → `ui.js:displaySavedWords()` → pagination event listeners
   - Update current page
   - Call `displaySavedWords(newPage, currentFilter)`
   - Scroll to top of word list

### **User clicks Edit (✎) button**
1. **Edit button click** → `ui.js:displaySavedWords()` → edit button event listener
   - Call `ui.js:showEditModal(word, definition, example)`

2. **Edit modal interaction** → `ui.js:showEditModal()`
   - Create modal overlay with form fields pre-populated
   - Focus on word input, select all text
   - Add keyboard shortcuts (Enter to save, Escape to cancel)

3. **User modifies and saves** → `ui.js:showEditModal()` → save button event listener
   - Validate required fields (word and definition)
   - Show "Saving..." state, disable button
   - Call `storage.js:updateWord(originalWord, newWord, newDefinition, newExample)`
   - Handle duplicate word conflicts with error messages
   - **Success**: Close modal, refresh saved words display
   - **Error**: Show validation errors or duplicate warnings

### **User clicks Delete (×) button**
1. **Delete button click** → `ui.js:displaySavedWords()` → delete button event listener
   - Show browser `confirm()` dialog: `Delete "word" from your vocabulary?`
   - If confirmed: Call `storage.js:deleteWord(word)`
   - **Success**: Refresh saved words display (stay on current page or go to previous if page becomes empty)
   - **Error**: Show alert: "Failed to delete word. Please try again."

## 5. Exercise Functionality (🎯 Tab)

### **Tab initialization**
1. **Tab activation** → `exercise.js:initExercise()`
   - Set up event listeners for start button, next button, restart button
   - Initialize session size preference (25 or 50 words) from localStorage
   - Set up Enter key handlers for answer submission and continuation

### **User selects session size (25/50)**
1. **Radio button change** → `exercise.js:initExercise()` → session size event listeners
   - Update localStorage with preference
   - No immediate UI change (affects next exercise start)

### **User clicks Start Exercise**
1. **Start button click** → `exercise.js:startExercise()`
   - Check cached exercise data (5-minute validity)
   - If cache invalid: Run parallel queries `getSavedWords()` + `getWordsDueForReview()`
   - Validate minimum 3 saved words requirement
   - Apply word selection algorithm:
     - Prioritize due words (up to session size limit)
     - Fill remaining slots with random saved words
     - Apply randomization for better distribution (split priority/other, shuffle both)

2. **Exercise initialization**
   - Hide start screen, show quiz UI
   - Reset session state (question index, progress, mastered set)
   - Call `showQuestion()` for first word

### **Exercise displays question**
1. **Question display** → `exercise.js:showQuestion()`
   - Apply slide-in animation to question card
   - Display word due info badge (New/Today/Overdue/+days/-days)
   - Show definition with first letter hint (e.g., "definition (W)")
   - Hide example sentence initially (revealed after answer)
   - Reset input field, show "Press Enter to submit" hint
   - Hide edit/delete buttons until answer submitted

### **User types answer and presses Enter**
1. **Enter key press** → `exercise.js:checkAnswer()`
   - Trim and lowercase user input
   - Compare with correct answer (case-insensitive)
   - Disable input, update hint to "Press Enter to continue"
   - Show edit/delete buttons
   - Increment total attempts counter

2. **For correct answers:**
   - Add word to mastered set (session tracking)
   - Reveal example with highlighted correct word
   - Apply green "correct-input" styling
   - Trigger sparkle animation
   - **Background**: Call `updateWordReview(word, true)` non-blocking

3. **For incorrect answers:**
   - Re-queue word (insert 2-3 positions ahead in exerciseWords array)
   - Reveal example with highlighted correct word
   - Apply red "incorrect-input" styling and shake animation
   - **Background**: Call `updateWordReview(word, false)` non-blocking

### **User presses Enter to continue**
1. **Enter key press** → Global document listener → `exercise.js:nextQuestion()`
   - Reset input styling and classes
   - Call `showQuestion()` for next word
   - Check if exercise complete (all words mastered)

### **User clicks Edit during exercise**
1. **Edit button click** → `exercise.js:handleEditWord()`
   - Get current word from exerciseWords array
   - Call `ui.js:showEditModal(word, definition, example)`
   - After modal closes: Refresh current question display and saved words list

### **User clicks Delete during exercise**
1. **Delete button click** → `exercise.js:handleDeleteWord()`
   - Get current word from exerciseWords array
   - Show confirm dialog: `Delete "word" from your vocabulary?`
   - If confirmed: Call `deleteWord()`, remove from exerciseWords array
   - Adjust question index, update saved words display
   - If no words left: Reset to start screen

### **Exercise completion**
1. **All words mastered** → `exercise.js:showQuestion()` → `showResults()`
   - Hide quiz UI, show results screen
   - Calculate unique words mastered and accuracy percentage
   - Display: "X words mastered" and "Y correct out of Z attempts (P%)"

### **User clicks Restart**
1. **Restart button click** → `exercise.js:resetExercise()`
   - Reset all session state variables
   - Hide quiz/results, show start screen
   - Re-render start screen with current session size preference

## 6. Spaced Repetition System

### **Answer submission triggers spaced repetition**
1. **Background update** → `storage.js:updateWordReview(word, isCorrect)`
   - Increment review_count
   - Update correct_count (if correct)
   - Calculate new interval based on performance:
     - **First correct**: interval = 1 day
     - **Second correct**: interval = 3 days
     - **Subsequent**: interval = previous × ease_factor
     - **Incorrect**: interval = 0 (immediate review)
   - Set next_review date based on new interval
   - Adjust ease_factor (2.5 default, increases with correct answers)

### **Due word calculation**
- Words are "due" when `next_review <= current_date`
- Used for prioritizing exercise word selection
- Displayed with badges: Overdue (-days), Today, Future (+days)

## 7. Data Management & Export

### **User clicks Export button**
1. **Export button click** → `main.js:exportWordsBtn` → `ui.js:showExportMenu()`
   - Show modal with JSON/CSV format options
   - Call `storage.js:exportWords(format)` when format selected
   - Generate file content and trigger browser download

### **User clicks Clear All Words**
1. **Clear button click** → `main.js:clearHistoryBtn`
   - Show browser confirm dialog (no custom message specified)
   - If confirmed: Call `storage.js:clearAllWords()`
   - Delete all user words from database
   - Refresh saved words display

## 8. Error Handling & Edge Cases

### **Network/API errors**
- **Word lookup failures**: Display error message in definition box
- **Save failures**: Show error button state with auto-reset
- **Authentication errors**: Custom styled error messages, form re-enable
- **Database errors**: Graceful handling with user feedback

### **Validation & constraints**
- **Empty inputs**: Prevent submission, show validation
- **Duplicate words**: Handle via update existing (no hard block)
- **Rate limiting**: 1 second delays between AI API calls
- **Minimum words**: 3 words required to start exercise

### **UI state management**
- **Loading states**: Button text changes, disabled states
- **Tab switching**: Lazy loading for saved words tab
- **Form validation**: Required field checks in edit modal
- **Keyboard shortcuts**: Enter to submit/save, Escape to cancel

## 9. Performance Optimizations

### **Implemented optimizations:**
- **Exercise data caching**: 5-minute cache for instant exercise starts
- **Parallel database queries**: Count and data queries run simultaneously
- **Background pre-fetching**: Exercise data ready when app loads
- **Non-blocking updates**: Spaced repetition updates don't delay UI
- **Pagination**: 50 words per page prevents large data transfers
- **Smart filtering**: Database-level filtering reduces data processing

### **Caching strategy:**
- **Exercise data**: Cached for 5 minutes, auto-refreshes on cache miss
- **Saved words**: Paginated loading prevents memory issues
- **API responses**: Rate limiting prevents overload
- **UI state**: Minimal DOM manipulation for smooth interactions

## 10. Database Schema & Relationships

### **Words table structure:**
```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

### **Data flow patterns:**
- **Input**: User lookups → Supabase cache check → AI API → Database storage
- **Processing**: Spaced repetition algorithm updates intervals on answer submission
- **Output**: Exercise selection prioritizes due words, applies randomization
- **Maintenance**: Automatic duplicate handling via UPSERT operations

### **Indexing strategy:**
- `(user_id, LOWER(word))` for fast duplicate checks
- `(user_id, next_review)` for efficient due word queries
- `(user_id, timestamp DESC)` for saved words pagination

This comprehensive analysis covers every user interaction and system response in the LingoDash application, providing complete visibility into the app's actual behavior and data flow.
