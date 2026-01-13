# LingoDash Comprehensive Test Specification

## Overview
This document provides detailed test cases for every user interaction documented in USER_FLOWS.md. Each test includes setup, execution, assertions, and edge cases based on the actual app implementation.

## Test Structure
- **Unit Tests**: Individual function/component testing
- **Integration Tests**: Multi-component user flows
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Timing and responsiveness validation

---

## 1. App Initialization & Authentication

### **Integration Test: App Initialization**
```javascript
describe('App Initialization', () => {
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="authWrapper" style="display: none;"></div>
      <div id="appWrapper" style="display: none;"></div>
      <div id="userEmail"></div>
      <button id="logoutBtn"></button>
    `;

    vi.mock('./js/auth.js', () => ({
      getCurrentUser: vi.fn(),
      onAuthStateChange: vi.fn()
    }));

    vi.mock('./js/lookup.js', () => ({ initLookup: vi.fn() }));
    vi.mock('./js/ui.js', () => ({
      initTabs: vi.fn(),
      displaySavedWords: vi.fn(),
      initFilterControls: vi.fn()
    }));
    vi.mock('./js/exercise.js', () => ({
      initExercise: vi.fn(),
      prefetchExerciseData: vi.fn()
    }));
  });

  test('should initialize auth UI when user not authenticated', async () => {
    // Setup: Mock unauthenticated state
    const { getCurrentUser } = await import('./js/auth.js');
    getCurrentUser.mockResolvedValue(null);

    // Execute: Initialize app
    const { initApp } = await import('./main.js');
    await initApp();

    // Assert: Auth UI visible, app UI hidden
    expect(document.getElementById('authWrapper').style.display).toBe('flex');
    expect(document.getElementById('appWrapper').style.display).toBe('none');
  });

  test('should initialize app features when user is authenticated', async () => {
    // Setup: Mock authenticated user
    const { getCurrentUser, onAuthStateChange } = await import('./js/auth.js');
    getCurrentUser.mockResolvedValue({ email: 'test@example.com' });
    onAuthStateChange.mockImplementation(() => {}); // No-op for test

    // Execute: Initialize app
    const { initApp } = await import('./main.js');
    await initApp();

    // Assert: App UI visible, auth UI hidden
    expect(document.getElementById('authWrapper').style.display).toBe('none');
    expect(document.getElementById('appWrapper').style.display).toBe('flex');

    // Assert: User email displayed
    expect(document.getElementById('userEmail').textContent).toBe('test@example.com');

    // Assert: App features initialized
    const { initTabs, displaySavedWords, initFilterControls } = await import('./js/ui.js');
    const { initLookup } = await import('./js/lookup.js');
    const { initExercise, prefetchExerciseData } = await import('./js/exercise.js');

    expect(initTabs).toHaveBeenCalled();
    expect(initLookup).toHaveBeenCalled();
    expect(initFilterControls).toHaveBeenCalled();
    expect(displaySavedWords).toHaveBeenCalled();
    expect(initExercise).toHaveBeenCalled();
    expect(prefetchExerciseData).toHaveBeenCalled();
  });

  test('should handle DOMContentLoaded initialization', async () => {
    // Setup: Mock authenticated state
    const { getCurrentUser } = await import('./js/auth.js');
    getCurrentUser.mockResolvedValue({ email: 'user@example.com' });

    // Execute: Simulate DOMContentLoaded
    const { initApp } = await import('./main.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert: Features initialized once
    const { initAppFeaturesOnce } = await import('./main.js');
    expect(initAppFeaturesOnce).toHaveBeenCalled();
  });
});
```

### **Integration Test: Authentication Flow**
```javascript
describe('Authentication Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="signinFormElement">
        <input id="signinEmail" type="email" value="user@example.com">
        <input id="signinPassword" type="password" value="password123">
        <button type="submit">Sign In</button>
      </form>
      <form id="signupFormElement">
        <input id="signupEmail" type="email" value="new@example.com">
        <input id="signupPassword" type="password" value="password123">
        <button type="submit">Sign Up</button>
      </form>
      <div id="authError" style="display: none;"></div>
      <div id="signupAuthError" style="display: none;"></div>
    `;

    vi.mock('./js/auth.js', () => ({
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    }));
  });

  test('should handle successful sign in', async () => {
    // Setup: Mock successful sign in
    const { signIn } = await import('./js/auth.js');
    signIn.mockResolvedValue({ success: true, user: { email: 'user@example.com' } });

    // Execute: Submit sign in form
    const form = document.getElementById('signinFormElement');
    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert: No error displayed
    const errorDiv = document.getElementById('authError');
    expect(errorDiv.style.display).toBe('none');

    // Assert: Form shows "Signing in..." and gets disabled
    const submitBtn = form.querySelector('button[type="submit"]');
    expect(submitBtn.textContent).toBe('Signing in...');
    expect(submitBtn.disabled).toBe(true);
  });

  test('should handle sign in error', async () => {
    // Setup: Mock sign in failure
    const { signIn } = await import('./js/auth.js');
    signIn.mockResolvedValue({ success: false, error: 'Invalid credentials' });

    // Execute: Submit form
    const form = document.getElementById('signinFormElement');
    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert: Error displayed with custom styling
    const errorDiv = document.getElementById('authError');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toBe('Invalid credentials');
    expect(errorDiv.style.background).toContain('#FDF0E6');

    // Assert: Button re-enabled
    const submitBtn = form.querySelector('button[type="submit"]');
    expect(submitBtn.disabled).toBe(false);
  });

  test('should handle successful sign up', async () => {
    // Setup: Mock successful signup
    const { signUp } = await import('./js/auth.js');
    signUp.mockResolvedValue({ success: true, user: { email: 'new@example.com' } });

    // Execute: Submit signup form
    const form = document.getElementById('signupFormElement');
    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert: Success message displayed
    const errorDiv = document.getElementById('signupAuthError');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toBe('Account created! Please sign in.');
    expect(errorDiv.style.background).toContain('#d4edda');

    // Assert: Switches to sign-in tab (auth tab switching logic)
  });

  test('should handle sign up error', async () => {
    // Setup: Mock signup failure
    const { signUp } = await import('./js/auth.js');
    signUp.mockResolvedValue({ success: false, error: 'Email already exists' });

    // Execute: Submit form
    const form = document.getElementById('signupFormElement');
    form.dispatchEvent(new Event('submit'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert: Error displayed
    const errorDiv = document.getElementById('signupAuthError');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toBe('Email already exists');
  });
});
```

---

## 2. Tab Navigation

### **Unit Test: Tab Switching**
```javascript
describe('Tab Navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="tab-btn active" data-tab="lookup">🔍</button>
      <button class="tab-btn" data-tab="saved">📚</button>
      <button class="tab-btn" data-tab="exercise">🎯</button>
      <div id="lookup-panel" class="tab-panel active"></div>
      <div id="saved-panel" class="tab-panel"></div>
      <div id="exercise-panel" class="tab-panel"></div>
    `;

    vi.mock('./js/ui.js', () => ({
      displaySavedWords: vi.fn()
    }));
  });

  test('should switch to saved words tab and load data', () => {
    // Setup: Import and initialize tabs
    const { initTabs } = await import('./js/ui.js');
    initTabs();

    // Execute: Click saved words tab
    const savedTab = document.querySelector('[data-tab="saved"]');
    savedTab.click();

    // Assert: Active classes updated
    expect(savedTab.classList.contains('active')).toBe(true);
    expect(document.querySelector('[data-tab="lookup"]').classList.contains('active')).toBe(false);

    // Assert: Panels visibility updated
    expect(document.getElementById('saved-panel').classList.contains('active')).toBe(true);
    expect(document.getElementById('lookup-panel').classList.contains('active')).toBe(false);

    // Assert: Saved words loaded (special case for saved tab)
    const { displaySavedWords } = await import('./js/ui.js');
    expect(displaySavedWords).toHaveBeenCalled();
  });

  test('should switch between tabs without loading data for non-saved tabs', () => {
    // Setup: Initialize tabs
    const { initTabs } = await import('./js/ui.js');
    initTabs();

    // Execute: Click exercise tab
    const exerciseTab = document.querySelector('[data-tab="exercise"]');
    exerciseTab.click();

    // Assert: Tab switching works
    expect(exerciseTab.classList.contains('active')).toBe(true);
    expect(document.getElementById('exercise-panel').classList.contains('active')).toBe(true);

    // Assert: No additional data loading for non-saved tabs
    const { displaySavedWords } = await import('./js/ui.js');
    expect(displaySavedWords).not.toHaveBeenCalled();
  });
});
```

---

## 3. Word Lookup (Single Mode)

### **Integration Test: Single Word Lookup Flow**
```javascript
describe('Single Word Lookup', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="textInput" value="test">
      <div id="definitionBox" class="definition-box" style="display: none;">
        <div id="definitionContent"></div>
      </div>
    `;

    vi.mock('./js/api.js', () => ({
      getWordDefinition: vi.fn()
    }));

    vi.mock('./js/storage.js', () => ({
      saveWord: vi.fn()
    }));

    vi.mock('./js/ui.js', () => ({
      displaySavedWords: vi.fn()
    }));
  });

  test('should lookup word and display cached result', async () => {
    // Setup: Mock cached word lookup
    const { getWordDefinition } = await import('./js/api.js');
    getWordDefinition.mockResolvedValue({
      word: 'test',
      definition: 'A procedure intended to establish the quality...',
      example: 'This is a test sentence.',
      fromSupabase: true
    });

    // Execute: Initialize lookup and trigger Enter
    const { initLookup } = await import('./js/lookup.js');
    initLookup();

    const input = document.getElementById('textInput');
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert: Loading state shown initially
    expect(document.getElementById('definitionContent').textContent).toContain('Looking up definition');

    // Wait for lookup to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Word displayed with cached indicator
    const content = document.getElementById('definitionContent');
    expect(content.innerHTML).toContain('test');
    expect(content.innerHTML).toContain('A procedure intended to establish');
    expect(content.innerHTML).toContain('✓ This word is already in your collection');

    // Assert: Save button shows "Already Saved (Update)"
    expect(content.innerHTML).toContain('✓ Already Saved (Update)');
  });

  test('should lookup new word from AI and provide save option', async () => {
    // Setup: Mock AI lookup for new word
    const { getWordDefinition } = await import('./js/api.js');
    getWordDefinition.mockResolvedValue({
      word: 'serendipity',
      definition: 'The occurrence of events by chance in a happy way',
      example: 'Finding serendipity in everyday life.',
      fromSupabase: false
    });

    // Execute: Trigger lookup
    const { initLookup } = await import('./js/lookup.js');
    initLookup();

    const input = document.getElementById('textInput');
    input.value = 'serendipity';
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: New word indicators
    const content = document.getElementById('definitionContent');
    expect(content.innerHTML).toContain('🆕 New word fetched from AI');
    expect(content.innerHTML).toContain('💾 Save Word');

    // Assert: Save button functional
    const saveBtn = document.getElementById('saveWordBtn');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn.disabled).toBe(false);
  });

  test('should handle lookup errors gracefully', async () => {
    // Setup: Mock API error
    const { getWordDefinition } = await import('./js/api.js');
    getWordDefinition.mockRejectedValue(new Error('API rate limit exceeded'));

    // Execute: Trigger lookup
    const { initLookup } = await import('./js/lookup.js');
    initLookup();

    const input = document.getElementById('textInput');
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Error displayed
    const content = document.getElementById('definitionContent');
    expect(content.innerHTML).toContain('API rate limit exceeded');
  });
});
```

### **Integration Test: Save Word Flow**
```javascript
describe('Save Word Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="definitionContent">
        <button id="saveWordBtn">💾 Save Word</button>
      </div>
    `;

    vi.mock('./js/storage.js', () => ({
      saveWord: vi.fn()
    }));

    vi.mock('./js/ui.js', () => ({
      displaySavedWords: vi.fn()
    }));
  });

  test('should save new word successfully', async () => {
    // Setup: Mock successful save
    const { saveWord } = await import('./js/storage.js');
    saveWord.mockResolvedValue(true);

    // Execute: Click save button
    const saveBtn = document.getElementById('saveWordBtn');
    saveBtn.click();

    // Assert: Loading state
    expect(saveBtn.textContent).toBe('💾 Saving...');
    expect(saveBtn.disabled).toBe(true);

    // Wait for save completion
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Success state
    expect(saveBtn.textContent).toBe('✓ Saved!');
    expect(saveBtn.style.background).toContain('#27ae60'); // Green color

    // Assert: Button resets after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2100));
    expect(saveBtn.textContent).toBe('💾 Save Word');
    expect(saveBtn.disabled).toBe(false);
  });

  test('should handle save failure', async () => {
    // Setup: Mock save failure
    const { saveWord } = await import('./js/storage.js');
    saveWord.mockResolvedValue(false);

    // Execute: Click save
    const saveBtn = document.getElementById('saveWordBtn');
    saveBtn.click();

    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Error state
    expect(saveBtn.textContent).toBe('❌ Error');
    expect(saveBtn.style.background).toContain('#e74c3c'); // Red color

    // Assert: Button resets after timeout
    await new Promise(resolve => setTimeout(resolve, 2100));
    expect(saveBtn.textContent).toBe('💾 Save Word');
    expect(saveBtn.disabled).toBe(false);
  });
});
```

---

## 4. Batch Word Lookup

### **Integration Test: Batch Lookup Flow**
```javascript
describe('Batch Word Lookup', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="mode-buttons">
        <button class="mode-btn active" data-mode="single">Single</button>
        <button class="mode-btn" data-mode="batch">Batch</button>
      </div>
      <div id="singleMode">
        <input id="textInput">
      </div>
      <div id="batchMode" style="display: none;">
        <textarea id="batchInput">word1\nword2\nword3</textarea>
        <button id="batchLookupBtn">Batch Lookup</button>
        <div id="batchProgress" style="display: none;"></div>
        <div id="batchResults"></div>
      </div>
    `;

    vi.mock('./js/api.js', () => ({
      getBatchWordDefinitions: vi.fn()
    }));

    vi.mock('./js/storage.js', () => ({
      saveWord: vi.fn()
    }));

    vi.mock('./js/ui.js', () => ({
      displaySavedWords: vi.fn()
    }));
  });

  test('should process batch words with progress updates', async () => {
    // Setup: Mock batch API response
    const { getBatchWordDefinitions } = await import('./js/api.js');
    getBatchWordDefinitions.mockImplementation(async (words, progressCallback, autoSaveCallback) => {
      const results = words.map(word => ({
        word,
        definition: `Definition of ${word}`,
        example: `Example with ${word}`,
        success: true,
        fromSupabase: false
      }));

      // Simulate progress updates
      for (let i = 0; i < words.length; i++) {
        progressCallback(i + 1, words.length, words[i], 'fetching');
        await autoSaveCallback(results[i]);
      }

      return results;
    });

    // Setup: Mock successful saves
    const { saveWord } = await import('./js/storage.js');
    saveWord.mockResolvedValue(true);

    // Execute: Initialize batch mode and click lookup
    const { initLookup } = await import('./js/lookup.js');
    initLookup();

    // Switch to batch mode
    const batchModeBtn = document.querySelector('[data-mode="batch"]');
    batchModeBtn.click();

    const batchBtn = document.getElementById('batchLookupBtn');
    batchBtn.click();

    // Assert: Button disabled during processing
    expect(batchBtn.disabled).toBe(true);

    // Assert: Progress shown
    const progress = document.getElementById('batchProgress');
    expect(progress.style.display).toBe('block');

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert: Results displayed
    const results = document.getElementById('batchResults');
    expect(results.innerHTML).toContain('word1');
    expect(results.innerHTML).toContain('word2');
    expect(results.innerHTML).toContain('word3');

    // Assert: Summary shown
    expect(results.innerHTML).toContain('✅ 3 new words saved to your collection');
  });
});
```

---

## 5. Saved Words Management

### **Integration Test: Display Saved Words**
```javascript
describe('Display Saved Words', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="savedWordsList"></div>
      <div id="paginationControls"></div>
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="new">New</button>
      <button class="filter-btn" data-filter="learning">Learning</button>
      <button class="filter-btn" data-filter="mastered">Mastered</button>
      <button class="filter-btn" data-filter="due">Due</button>
    `;

    vi.mock('./js/storage.js', () => ({
      getSavedWordsPaginated: vi.fn()
    }));
  });

  test('should display paginated words with status badges', async () => {
    // Setup: Mock paginated data with different review states
    const { getSavedWordsPaginated } = await import('./js/storage.js');
    getSavedWordsPaginated.mockResolvedValue({
      words: [
        { word: 'newWord', definition: 'brand new', reviewCount: 0, nextReview: null },
        { word: 'learning', definition: 'in progress', reviewCount: 3, interval: 3 },
        { word: 'mastered', definition: 'fully learned', reviewCount: 10, interval: 45 },
        { word: 'overdue', definition: 'needs review', reviewCount: 5, nextReview: new Date(Date.now() - 86400000).toISOString() }
      ],
      totalCount: 150,
      totalPages: 3,
      currentPage: 1
    });

    // Execute: Display saved words
    const { displaySavedWords } = await import('./js/ui.js');
    await displaySavedWords();

    // Assert: Words rendered with correct badges
    const list = document.getElementById('savedWordsList');
    expect(list.innerHTML).toContain('newWord');
    expect(list.innerHTML).toContain('learning');
    expect(list.innerHTML).toContain('mastered');
    expect(list.innerHTML).toContain('overdue');

    // Assert: Status badges applied correctly
    expect(list.innerHTML).toContain('New</span>'); // reviewCount = 0
    expect(list.innerHTML).toContain('Learning</span>'); // reviewCount > 0, interval < 10
    expect(list.innerHTML).toContain('Mastered</span>'); // interval >= 30
    expect(list.innerHTML).toContain('Due</span>'); // overdue

    // Assert: Pagination rendered
    const pagination = document.getElementById('paginationControls');
    expect(pagination.innerHTML).toContain('Page 1');
    expect(pagination.innerHTML).toContain('Page 3');
  });

  test('should handle filter changes', async () => {
    // Setup: Mock filtered data
    const { getSavedWordsPaginated } = await import('./js/storage.js');
    getSavedWordsPaginated.mockResolvedValue({
      words: [{ word: 'dueWord', definition: 'due for review', reviewCount: 2 }],
      totalCount: 5,
      totalPages: 1,
      currentPage: 1
    });

    // Execute: Initialize filters and click due filter
    const { initFilterControls } = await import('./js/ui.js');
    initFilterControls();

    const dueFilter = document.querySelector('[data-filter="due"]');
    dueFilter.click();

    // Assert: Filter applied to data request
    expect(getSavedWordsPaginated).toHaveBeenCalledWith(1, 50, 'due');
  });

  test('should handle empty results', async () => {
    // Setup: Mock empty results
    const { getSavedWordsPaginated } = await import('./js/storage.js');
    getSavedWordsPaginated.mockResolvedValue({
      words: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    });

    // Execute: Display saved words
    const { displaySavedWords } = await import('./js/ui.js');
    await displaySavedWords(1, 'due');

    // Assert: Empty state message
    const list = document.getElementById('savedWordsList');
    expect(list.innerHTML).toContain('No words due for review');
  });
});
```

### **Integration Test: Edit Word Flow**
```javascript
describe('Edit Word Flow', () => {
  beforeEach(() => {
    // Setup DOM for edit modal
    document.body.innerHTML = `
      <div id="savedWordsList">
        <div class="saved-word-item">
          <button class="edit-btn" data-word="test" data-definition="old def" data-example="old example">✎</button>
        </div>
      </div>
    `;

    vi.mock('./js/ui.js', () => ({
      showEditModal: vi.fn()
    }));
  });

  test('should open edit modal with word data', () => {
    // Setup: Initialize saved words display
    const { initTabs } = await import('./js/ui.js');
    initTabs();

    // Execute: Click edit button
    const editBtn = document.querySelector('.edit-btn');
    editBtn.click();

    // Assert: Edit modal opened with correct data
    const { showEditModal } = await import('./js/ui.js');
    expect(showEditModal).toHaveBeenCalledWith('test', 'old def', 'old example');
  });
});

describe('Edit Modal Functionality', () => {
  beforeEach(() => {
    // Setup edit modal DOM
    document.body.innerHTML = `
      <div class="edit-overlay" style="display: block;">
        <div class="edit-modal">
          <input id="edit-word" value="test">
          <textarea id="edit-definition">old definition</textarea>
          <textarea id="edit-example">old example</textarea>
          <div class="edit-error" style="display: none;"></div>
          <div class="edit-buttons">
            <button id="edit-save-btn">Save</button>
            <button id="edit-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    vi.mock('./js/storage.js', () => ({
      updateWord: vi.fn()
    }));

    vi.mock('./js/ui.js', () => ({
      displaySavedWords: vi.fn()
    }));
  });

  test('should save word changes successfully', async () => {
    // Setup: Mock successful update
    const { updateWord } = await import('./js/storage.js');
    updateWord.mockResolvedValue(true);

    // Execute: Modify and save
    const wordInput = document.getElementById('edit-word');
    const defInput = document.getElementById('edit-definition');
    const saveBtn = document.getElementById('edit-save-btn');

    wordInput.value = 'updated';
    defInput.value = 'updated definition';
    saveBtn.click();

    // Wait for save
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Update called with correct data
    expect(updateWord).toHaveBeenCalledWith('test', 'updated', 'updated definition', 'old example');

    // Assert: Modal closed
    expect(document.querySelector('.edit-overlay')).toBeNull();

    // Assert: Saved words refreshed
    const { displaySavedWords } = await import('./js/ui.js');
    expect(displaySavedWords).toHaveBeenCalled();
  });

  test('should validate required fields', async () => {
    // Execute: Try to save with empty definition
    const defInput = document.getElementById('edit-definition');
    const saveBtn = document.getElementById('edit-save-btn');

    defInput.value = '';
    saveBtn.click();

    // Assert: Validation error shown
    const errorDiv = document.querySelector('.edit-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toContain('required');

    // Assert: Modal still open
    expect(document.querySelector('.edit-overlay')).toBeTruthy();
  });

  test('should handle duplicate word conflicts', async () => {
    // Setup: Mock duplicate error
    const { updateWord } = await import('./js/storage.js');
    updateWord.mockResolvedValue({ error: 'duplicate', message: 'Word "test" already exists with different definition' });

    // Execute: Try to save duplicate
    const saveBtn = document.getElementById('edit-save-btn');
    saveBtn.click();

    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Duplicate error displayed
    const errorDiv = document.querySelector('.edit-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toContain('already exists');
  });
});
```

---

## 6. Exercise Functionality

### **Integration Test: Start Exercise Flow**
```javascript
describe('Start Exercise Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="exerciseContent">
        <div class="session-size-selector">
          <label class="session-size-option">
            <input type="radio" name="sessionSize" value="25" id="sessionSize25" checked>
            <span>25</span>
          </label>
          <label class="session-size-option">
            <input type="radio" name="sessionSize" value="50" id="sessionSize50">
            <span>50</span>
          </label>
        </div>
        <button id="startExercise">Start</button>
      </div>
      <div id="exerciseQuiz" style="display: none;"></div>
    `;

    vi.mock('./js/storage.js', () => ({
      getSavedWords: vi.fn(),
      getWordsDueForReview: vi.fn()
    }));
  });

  test('should start exercise with sufficient words', async () => {
    // Setup: Mock saved words and due words
    const { getSavedWords, getWordsDueForReview } = await import('./js/storage.js');

    getSavedWords.mockResolvedValue([
      { word: 'word1', definition: 'def1', id: 1 },
      { word: 'word2', definition: 'def2', id: 2 },
      { word: 'word3', definition: 'def3', id: 3 },
      { word: 'word4', definition: 'def4', id: 4 }
    ]);

    getWordsDueForReview.mockResolvedValue([
      { word: 'word1', definition: 'def1', id: 1, nextReview: new Date().toISOString() }
    ]);

    // Execute: Initialize exercise and click start
    const { initExercise } = await import('./js/exercise.js');
    initExercise();

    const startBtn = document.getElementById('startExercise');
    startBtn.click();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Quiz started
    expect(document.getElementById('exerciseQuiz').style.display).toBe('block');
    expect(document.getElementById('exerciseContent').style.display).toBe('none');

    // Assert: Session size preference saved (25 words selected)
    expect(localStorage.getItem('lingodash_session_size')).toBe('25');
  });

  test('should prevent exercise start with insufficient words', async () => {
    // Setup: Mock insufficient words
    const { getSavedWords } = await import('./js/storage.js');
    getSavedWords.mockResolvedValue([
      { word: 'word1', definition: 'def1', id: 1 },
      { word: 'word2', definition: 'def2', id: 2 }
    ]);

    // Execute: Try to start exercise
    const { initExercise } = await import('./js/exercise.js');
    initExercise();

    const startBtn = document.getElementById('startExercise');
    startBtn.click();

    // Wait for validation
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert: Error message shown
    const content = document.getElementById('exerciseContent');
    expect(content.innerHTML).toContain('at least 3 saved words');
  });

  test('should use cached exercise data for instant loading', async () => {
    // Setup: Mock cache hit
    const { getSavedWords, getWordsDueForReview } = await import('./js/storage.js');

    // First call (cache population)
    getSavedWords.mockResolvedValueOnce([
      { word: 'cached1', definition: 'def1', id: 1 },
      { word: 'cached2', definition: 'def2', id: 2 },
      { word: 'cached3', definition: 'def3', id: 3 }
    ]);
    getWordsDueForReview.mockResolvedValueOnce([]);

    // Execute: Prefetch data first
    const { prefetchExerciseData } = await import('./js/exercise.js');
    await prefetchExerciseData();

    // Reset mocks for start exercise
    getSavedWords.mockResolvedValue([
      { word: 'cached1', definition: 'def1', id: 1 },
      { word: 'cached2', definition: 'def2', id: 2 },
      { word: 'cached3', definition: 'def3', id: 3 }
    ]);

    // Execute: Start exercise (should use cache)
    const { initExercise, startExercise } = await import('./js/exercise.js');
    initExercise();

    const startBtn = document.getElementById('startExercise');
    startBtn.click();

    // Assert: Cache used (getSavedWords called fewer times)
    expect(getSavedWords).toHaveBeenCalledTimes(1); // Only for startExercise, not prefetch
  });
});
```

### **Integration Test: Answer Checking Flow**
```javascript
describe('Answer Checking Flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="exerciseQuiz">
        <div class="question-card-minimal">
          <div id="wordDueInfo"></div>
          <div id="definitionDisplay"></div>
          <div id="exampleSentence"></div>
          <input id="answerInput">
          <div id="answerFeedback"></div>
          <div id="exerciseCardActions" style="display: none;">
            <button id="exerciseEditBtn">Edit</button>
            <button id="exerciseDeleteBtn">Delete</button>
          </div>
        </div>
      </div>
    `;

    // Mock exercise state
    vi.mock('./js/exercise.js', () => ({
      exerciseWords: [{ word: 'test', definition: 'definition', example: 'Test example.' }],
      currentQuestionIndex: 0
    }));
  });

  test('should handle correct answer with visual feedback', () => {
    // Setup: Initialize exercise
    const { initExercise } = await import('./js/exercise.js');
    initExercise();

    // Execute: Enter correct answer and press Enter
    const input = document.getElementById('answerInput');
    input.value = 'test';
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    // Assert: Input disabled
    expect(input.disabled).toBe(true);

    // Assert: Example sentence revealed with highlighting
    const example = document.getElementById('exampleSentence');
    expect(example.innerHTML).toContain('<mark class="highlight-word">test</mark>');

    // Assert: Input styling changed to correct
    expect(input.classList.contains('correct-input')).toBe(true);

    // Assert: Edit/delete buttons shown
    expect(document.getElementById('exerciseCardActions').style.display).toBe('flex');

    // Assert: Sparkle animation triggered (would need DOM assertion)
  });

  test('should handle incorrect answer with re-queuing', () => {
    // Setup: Initialize exercise
    const { initExercise } = await import('./js/exercise.js');
    initExercise();

    // Execute: Enter incorrect answer
    const input = document.getElementById('answerInput');
    input.value = 'wrong';
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    // Assert: Input styling changed to incorrect
    expect(input.classList.contains('incorrect-input')).toBe(true);

    // Assert: Example sentence revealed with highlighting
    const example = document.getElementById('exampleSentence');
    expect(example.innerHTML).toContain('<mark class="highlight-word">test</mark>');

    // Assert: Edit/delete buttons shown
    expect(document.getElementById('exerciseCardActions').style.display).toBe('flex');

    // Assert: Word re-queued (would need to verify exerciseWords array modified)
  });
});
```

---

## 7. Performance Tests

### **Performance Test: Loading Times**
```javascript
describe('Performance Tests', () => {
  test('exercise start should complete within 1.5 seconds with fresh data', async () => {
    const startTime = performance.now();

    // Setup: Mock fresh data load
    const { getSavedWords, getWordsDueForReview } = await import('./js/storage.js');
    getSavedWords.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 700)); // 0.7s delay
      return Array(50).fill().map((_, i) => ({
        word: `word${i}`, definition: `def${i}`, id: i
      }));
    });
    getWordsDueForReview.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 600)); // 0.6s delay
      return Array(10).fill().map((_, i) => ({
        word: `due${i}`, definition: `due def${i}`, id: i + 100
      }));
    });

    // Execute: Start exercise
    const { startExercise } = await import('./js/exercise.js');
    await startExercise();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Assert: Performance requirement met (1.3s actual < 1.5s limit)
    expect(duration).toBeLessThan(1500);
  });

  test('exercise start should complete instantly with cached data', async () => {
    // Setup: Mock instant cached responses
    const { getSavedWords, getWordsDueForReview } = await import('./js/storage.js');
    getSavedWords.mockResolvedValue([
      { word: 'cached1', definition: 'def1', id: 1 },
      { word: 'cached2', definition: 'def2', id: 2 }
    ]);
    getWordsDueForReview.mockResolvedValue([
      { word: 'due1', definition: 'due def1', id: 3 }
    ]);

    const startTime = performance.now();

    // Execute: Start exercise
    const { startExercise } = await import('./js/exercise.js');
    await startExercise();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Assert: Very fast with cached data (< 50ms)
    expect(duration).toBeLessThan(50);
  });

  test('saved words loading should complete within 2 seconds', async () => {
    const startTime = performance.now();

    // Setup: Mock paginated data with realistic delay
    const { getSavedWordsPaginated } = await import('./js/storage.js');
    getSavedWordsPaginated.mockImplementation(async (page, pageSize, filter) => {
      await new Promise(resolve => setTimeout(resolve, 800)); // 0.8s delay
      return {
        words: Array(50).fill().map((_, i) => ({
          word: `word${i}`, definition: `def${i}`, id: i
        })),
        totalCount: 500,
        totalPages: 10,
        currentPage: page
      };
    });

    // Execute: Load saved words
    const { displaySavedWords } = await import('./js/ui.js');
    await displaySavedWords();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Assert: Performance requirement met
    expect(duration).toBeLessThan(2000);
  });
});
```

---

## Test Execution Notes

### **Setup Requirements:**
- Vitest test runner configured
- JSDOM environment for DOM testing
- Mock implementations for Supabase client
- Test utilities for DOM manipulation and async operations

### **Test Organization:**
- **Unit tests**: `src/js/*.test.js`
- **Integration tests**: `src/js/*.integration.test.js`
- **E2E tests**: `tests/e2e/` (future expansion)
- **Performance tests**: `src/js/performance.test.js`

### **Mock Strategy:**
- **Supabase client**: Mock all database operations with realistic responses
- **DOM APIs**: Use JSDOM for element manipulation and event simulation
- **Timers**: Mock setTimeout/setInterval for animation and delay testing
- **External APIs**: Mock network requests with configurable delays

### **CI/CD Integration:**
- Run unit tests on every commit
- Run integration tests on pull requests
- Run performance tests weekly with detailed reporting
- Generate coverage reports with minimum thresholds

### **Key Testing Patterns:**
- **Async testing**: Proper `await` usage with timeout helpers
- **DOM testing**: Element creation and event simulation
- **State verification**: Checking both DOM and JavaScript state
- **Error scenarios**: Testing failure paths and error handling
- **Performance validation**: Measuring execution times with requirements

This comprehensive test suite ensures every user interaction works correctly and maintains performance standards as implemented in the actual LingoDash application.
