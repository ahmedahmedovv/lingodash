# API Reference

Complete technical documentation of LingoDash's JavaScript API and module structure.

## Module Overview

LingoDash is built with ES6 modules for clean, maintainable code architecture.

### Core Modules

```
src/js/
├── main.js          # Application entry point & initialization
├── api.js           # Mistral AI API integration
├── config.js        # API configuration & constants
├── supabase.js      # Supabase client & database config
├── storage.js       # CRUD operations & data management
├── lookup.js        # Word lookup UI logic
├── exercise.js      # Exercise system & spaced repetition
├── ui.js            # User interface components & tabs
├── auth.js          # Authentication handling
├── authUI.js        # Authentication UI components
└── utils/           # Utility functions (if any)
```

## API Module (`api.js`)

Handles all external API communications, primarily with Mistral AI.

### `getWordDefinition(word, retryCount = 0)`

Looks up a single word definition using Mistral AI with advanced prompt engineering.

**Parameters:**
- `word` (string): The word to look up
- `retryCount` (number, optional): Number of retries attempted (internal use)

**Returns:** Promise resolving to object:
```javascript
{
  word: string,           // Original word
  definition: string,     // AI-generated definition
  example: string,        // Example sentence
  fromSupabase: boolean,  // Whether cached from database
  potentiallyInvalid?: boolean, // Whether example validation failed after retries
  success: boolean        // Operation success status
}
```

**Behavior:**
- First checks Supabase cache for existing word
- Falls back to Mistral AI if not cached
- Uses advanced prompt engineering to ensure examples contain the exact word
- Implements validation to check if generated examples actually contain the target word
- Automatic retries (up to 3 attempts) if example validation fails
- Implements rate limiting (1 second between AI calls)
- Handles API errors with exponential backoff retry logic

### `regenerateWordExample(word, retryCount = 0)`

Regenerates a new example sentence for an existing word using advanced AI prompt engineering.

**Parameters:**
- `word` (string): The word to regenerate an example for
- `retryCount` (number, optional): Number of retries attempted (internal use)

**Returns:** Promise resolving to object (same format as getWordDefinition):
```javascript
{
  word: string,           // Original word
  definition: string,     // AI-generated definition
  example: string,        // New example sentence
  fromSupabase: boolean,  // Always false for regeneration
  potentiallyInvalid?: boolean, // Whether example validation failed after retries
  success: boolean        // Operation success status
}
```

**Behavior:**
- Uses specialized regeneration prompts to create fresh examples
- Implements the same validation and retry logic as word lookup
- Ensures the new example contains the exact target word
- Designed for improving or refreshing existing word examples

### `getBatchWordDefinitions(words, progressCallback, autoSaveCallback)`

Processes multiple words in batch with progress tracking.

**Parameters:**
- `words` (string[]): Array of words to process
- `progressCallback` (function): Called for each word processed
  - Parameters: `(currentIndex, totalCount, currentWord, status)`
  - Status: `'checking'`, `'reusing'`, `'fetching'`, `'error'`
- `autoSaveCallback` (function): Called to auto-save successful lookups
  - Parameter: `wordData` object (same format as getWordDefinition)

**Returns:** Promise resolving to array of results

**Features:**
- Sequential processing to respect rate limits
- Progress callbacks for UI updates
- Automatic saving of successful lookups
- Per-word error handling
- Smart caching: reuses existing words from database when available

## Storage Module (`storage.js`)

Database operations and data management layer.

### Word Operations

#### `saveWord(word, definition, example)`

Saves a new word or updates existing one.

**Parameters:**
- `word` (string): Vocabulary word
- `definition` (string): Word definition
- `example` (string): Example sentence (optional)

**Returns:** Promise resolving to boolean (success status)

**Behavior:**
- Checks for duplicates using `user_id + LOWER(word)`
- Updates existing words instead of creating duplicates
- Handles database errors gracefully

#### `getSavedWords()`

Retrieves all saved words for current user.

**Returns:** Promise resolving to array of word objects

#### `getSavedWordsPaginated(page, limit, filter)`

Retrieves paginated words with optional filtering.

**Parameters:**
- `page` (number): Page number (1-based)
- `limit` (number): Words per page (default: 50)
- `filter` (string): Filter type - `'all'`, `'new'`, `'learning'`, `'mastered'`, `'due'`

**Returns:** Promise resolving to object:
```javascript
{
  words: Word[],          // Array of word objects
  totalCount: number,     // Total words matching filter
  totalPages: number,     // Total pages available
  currentPage: number     // Current page number
}
```

#### `updateWord(originalWord, newWord, newDefinition, newExample)`

Updates an existing word's data.

**Parameters:**
- `originalWord` (string): Current word text (for lookup)
- `newWord` (string): New word text
- `newDefinition` (string): New definition
- `newExample` (string): New example (optional)

**Returns:** Promise resolving to boolean

#### `deleteWord(word)`

Removes a word from the database.

**Parameters:**
- `word` (string): Word to delete

**Returns:** Promise resolving to boolean

### Exercise Data

#### `getWordsDueForReview()`

Gets words scheduled for review (spaced repetition).

**Returns:** Promise resolving to array of due words

#### `updateWordReview(word, isCorrect)`

Updates spaced repetition data after an answer.

**Parameters:**
- `word` (string): Word that was reviewed
- `isCorrect` (boolean): Whether answer was correct

**Behavior:**
- Increments review_count
- Updates correct_count if correct
- Recalculates interval using spaced repetition algorithm
- Sets new next_review date

### Export Functions

#### `exportWords(format)`

Exports user vocabulary in specified format.

**Parameters:**
- `format` (string): `'json'` or `'csv'`

**Returns:** Promise resolving to export data

**JSON Format:**
```javascript
[
  {
    word: "example",
    definition: "a thing characteristic of its kind",
    example: "This is an example sentence.",
    // ... all spaced repetition fields
  }
]
```

**CSV Format:**
```csv
word,definition,example,timestamp,interval,ease_factor,next_review,review_count,correct_count
example,"a thing characteristic of its kind","This is an example sentence.",2024-01-01T00:00:00Z,3,2.5,2024-01-04T00:00:00Z,2,2
```

#### `clearAllWords()`

Removes all words for current user.

**Returns:** Promise resolving to boolean

**Warning:** Destructive operation, use with confirmation

## Exercise Module (`exercise.js`)

Manages exercise sessions and persistent learning logic.

### Session Management

#### `startExercise()`

Initializes a new exercise session.

**Behavior:**
- Validates minimum word count (3+)
- Fetches due words + fills with random words
- Applies randomization and prioritization
- Caches data for 5 minutes

#### `showQuestion()`

Displays next question in exercise.

**Logic:**
- Selects word from exercise queue
- Applies first-letter hint
- Shows due date badge
- Reveals example after answer

#### `checkAnswer()`

Validates user answer and updates learning state.

**Parameters:**
- `userAnswer` (string): User's typed answer

**Behavior:**
- Case-insensitive comparison
- Updates mastered set on correct answers
- Re-queues incorrect words (2-3 positions later)
- Triggers spaced repetition updates

#### `nextQuestion()`

Advances to next question or shows results.

**Logic:**
- Checks if all words mastered
- Continues exercise or shows completion screen
- Updates progress indicators

### Session State

The exercise module maintains several state variables:

```javascript
let exerciseWords = [];           // Current question queue
let currentQuestionIndex = 0;     // Current position
let masteredWords = new Set();    // Words answered correctly
let totalAttempts = 0;            // Total questions answered
let correctAnswers = 0;           // Total correct answers
let sessionSize = 25;             // Words per session (25 or 50)
```

## UI Module (`ui.js`)

User interface components and DOM manipulation.

### Tab Management

#### `initTabs()`

Sets up tab navigation functionality.

**Behavior:**
- Binds click handlers to tab buttons
- Manages active states and panel visibility
- Special handling for saved words tab (triggers data load)

#### `displaySavedWords(page, filter)`

Renders paginated word list with filtering.

**Parameters:**
- `page` (number): Page to display (default: 1)
- `filter` (string): Filter to apply (default: 'all')

### Modal Management

#### `showEditModal(word, definition, example)`

Displays word editing modal.

**Parameters:**
- `word`, `definition`, `example`: Pre-populated values

**Features:**
- Input validation
- Keyboard shortcuts (Enter to save, Escape to cancel)
- Duplicate word conflict handling

### Filter Controls

#### `initFilterControls()`

Sets up filter button functionality.

**Behavior:**
- Updates active filter states
- Triggers data reload with new filter
- Maintains filter preference across sessions

## Auth Module (`auth.js`)

Authentication handling (currently simplified).

### `getCurrentUser()`

Retrieves current user information.

**Returns:** Promise resolving to user object or null

### `signIn(email, password)`

Authenticates user.

**Parameters:**
- `email` (string): User email
- `password` (string): User password

**Returns:** Promise resolving to result object

### `signUp(email, password)`

Creates new user account.

**Parameters:**
- `email`, `password`: User credentials

**Returns:** Promise resolving to result object

### `signOut()`

Signs out current user.

**Returns:** Promise resolving to boolean

## Configuration Module (`config.js`)

API keys and application constants. **⚠️ Security Note**: API keys should be loaded from environment variables, not hardcoded.

```javascript
// Load from environment variables (recommended)
export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || 'your-key-here-for-dev';
export const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Rate limiting
export const RATE_LIMIT_DELAY = 1000; // 1 second between AI calls
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 2000; // Initial retry delay

// Exercise settings
export const MIN_WORDS_FOR_EXERCISE = 3;
export const DEFAULT_SESSION_SIZE = 25;
export const EXERCISE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pagination
export const WORDS_PER_PAGE = 50;
```

**Environment Variables Setup:**
```bash
# .env file (create in project root)
VITE_MISTRAL_API_KEY=your-actual-api-key-here
```

**⚠️ Never commit .env files to version control!**

## Supabase Module (`supabase.js`)

Database client configuration and connection.

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## Error Handling Patterns

### Try-Catch Blocks

All API operations use consistent error handling:

```javascript
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

### User Feedback

- **Loading states**: Button text changes, disabled states
- **Success feedback**: Green styling, auto-reset after 2 seconds
- **Error feedback**: Red styling, descriptive messages
- **Progress indicators**: For long-running batch operations

### Network Resilience

- **Retry logic**: Automatic retries for transient failures
- **Rate limiting**: Built-in delays to prevent quota exhaustion
- **Offline handling**: Graceful degradation when offline
- **Timeout handling**: Reasonable timeouts for API calls

## Performance Optimizations

### Caching Strategies

- **Exercise data**: 5-minute cache for instant starts
- **API responses**: Database caching prevents repeated AI calls
- **UI state**: Minimal DOM manipulation for smooth interactions

### Database Optimizations

- **Pagination**: 50 words per page prevents large data transfers
- **Indexing**: Database indexes for fast queries
- **Batch operations**: Efficient bulk data handling

### Asynchronous Patterns

- **Non-blocking updates**: Spaced repetition updates run in background
- **Parallel queries**: Count and data queries run simultaneously
- **Lazy loading**: Data loaded only when needed

## Testing Hooks

The codebase includes testing utilities for comprehensive coverage:

```javascript
// Mock API responses
vi.mock('./js/api.js', () => ({
  getWordDefinition: vi.fn()
}));

// Test DOM interactions
document.body.innerHTML = `<div id="test-element"></div>`;

// Assert async operations
await waitFor(() => {
  expect(callback).toHaveBeenCalled();
});
```

---

*For implementation examples, see the test files in the codebase.*
