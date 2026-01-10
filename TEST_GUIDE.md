# Testing Guide for LingoDash

This project uses **Vitest** as the testing framework - a fast, modern testing solution built specifically for Vite projects.

## Running Tests

### Run all tests once
```bash
npm test
# or
npm run test:run
```

### Run tests in watch mode (re-runs on file changes)
```bash
npm test
```

### Run tests with UI (interactive browser interface)
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run coverage
```

## Test Files

All test files are located alongside their source files with the `.test.js` extension:

- `src/js/storage.test.js` - Tests for localStorage operations
- `src/js/api.test.js` - Tests for API calls to Mistral
- `src/js/ui.test.js` - Tests for UI components and tab switching
- `src/js/exercise.test.js` - Tests for exercise logic

## Test Coverage

### Storage Tests (11 tests)
- ✅ Get saved words from localStorage
- ✅ Save new words with deduplication
- ✅ Delete words
- ✅ Clear all words with confirmation
- ✅ Limit words to 50 entries
- ✅ Case-insensitive operations

### API Tests (8 tests)
- ✅ Fetch word definitions from Mistral API
- ✅ Parse definition and example from response
- ✅ Handle various error scenarios (401, 429, network errors)
- ✅ Validate API request format
- ✅ Handle empty/whitespace inputs

### UI Tests (8 tests)
- ✅ Display saved words list
- ✅ Show empty state when no words saved
- ✅ Delete buttons functionality
- ✅ Tab switching between Lookup, Saved Words, and Exercise
- ✅ Active tab highlighting

### Exercise Tests (15 tests)
- ✅ Minimum 3 words requirement
- ✅ Case-insensitive answer checking
- ✅ Word blanking in example sentences
- ✅ Score tracking and calculation
- ✅ Question navigation logic
- ✅ Percentage calculation

## Test Results

```
✓ src/js/storage.test.js (11 tests)
✓ src/js/api.test.js (8 tests)
✓ src/js/ui.test.js (8 tests)
✓ src/js/exercise.test.js (15 tests)

Test Files: 4 passed (4)
Tests: 42 passed (42) ✅
```

## Writing New Tests

### Basic test structure
```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './yourFile.js';

describe('Your Feature', () => {
  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Mocking functions
```javascript
import { vi } from 'vitest';

const mockFn = vi.fn(() => 'mocked value');
```

### Setup and teardown
```javascript
import { beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  // Run before each test
});

afterEach(() => {
  // Run after each test
});
```

## Test Configuration

Tests are configured in `vite.config.js`:
- Environment: `happy-dom` (lightweight DOM implementation)
- Setup file: `vitest.setup.js` (localStorage mock)
- Coverage: Text, JSON, and HTML reports

## Continuous Integration

To run tests in CI/CD pipelines, use:
```bash
npm run test:run
```

This runs tests once and exits with appropriate status codes.

## Debugging Tests

1. Add `console.log()` statements in your tests
2. Use `test.only()` to run a single test:
   ```javascript
   it.only('should test something specific', () => {
     // This test will run alone
   });
   ```
3. Use the UI mode for visual debugging:
   ```bash
   npm run test:ui
   ```

## Best Practices

1. ✅ Write tests alongside your code
2. ✅ Test both success and error cases
3. ✅ Use descriptive test names
4. ✅ Keep tests isolated and independent
5. ✅ Mock external dependencies (API calls, localStorage)
6. ✅ Aim for high coverage of critical paths

## Notes

- The stderr warnings in test output (like "Error fetching definition") are expected - they're from testing error handling code
- Tests use mocked localStorage and API calls, so they don't require network access
- All tests run in parallel by default for faster execution
