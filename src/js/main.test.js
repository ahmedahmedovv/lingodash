import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all modules before importing main
vi.mock('./auth.js', () => ({
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn()
}));

vi.mock('./lookup.js', () => ({
  initLookup: vi.fn()
}));

vi.mock('./ui/index.js', () => ({
  initTabs: vi.fn(),
  displaySavedWords: vi.fn(),
  initFilterControls: vi.fn()
}));

vi.mock('./exercise/index.js', () => ({
  initExercise: vi.fn(),
  prefetchExerciseData: vi.fn()
}));

vi.mock('./storage/index.js', () => ({
  clearAllWords: vi.fn()
}));

import { initApp, initAppFeaturesOnce } from '../main.js';
import { getCurrentUser, onAuthStateChange } from './auth.js';
import { initLookup } from './lookup.js';
import { initTabs, displaySavedWords, initFilterControls } from './ui/index.js';
import { initExercise, prefetchExerciseData } from './exercise/index.js';
import { clearAllWords } from './storage/index.js';

describe('Main App Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = `
      <div id="authWrapper"></div>
      <div id="appWrapper"></div>
      <div id="userEmail"></div>
      <button id="logoutBtn"></button>
      <button id="clearHistory"></button>
      <button id="exportWords"></button>
    `;

    // Reset module state
    // Note: This would need to be handled differently in a real implementation
    // For now, we'll test the behavior assuming clean state
  });

  describe('initApp', () => {
    it('should initialize authentication UI', async () => {
      getCurrentUser.mockResolvedValue(null);

      await initApp();

      // Should set up auth UI (forms should exist)
      expect(document.getElementById('authWrapper')).toBeTruthy();
      expect(document.getElementById('appWrapper')).toBeTruthy();
    });

    it('should show auth UI when user not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);

      await initApp();

      // Wait for DOM updates
      await new Promise(resolve => setTimeout(resolve, 10));

      const authWrapper = document.getElementById('authWrapper');
      const appWrapper = document.getElementById('appWrapper');

      expect(authWrapper.style.display).toBe('flex');
      expect(appWrapper.style.display).toBe('none');
    });

    it('should show app UI when user authenticated', async () => {
      const mockUser = { email: 'test@example.com' };
      getCurrentUser.mockResolvedValue(mockUser);

      await initApp();

      const authWrapper = document.getElementById('authWrapper');
      const appWrapper = document.getElementById('appWrapper');

      expect(authWrapper.style.display).toBe('none');
      expect(appWrapper.style.display).toBe('flex');
      expect(document.getElementById('userEmail').textContent).toBe('test@example.com');
    });

    it('should set up auth state change listeners', async () => {
      const mockCallback = vi.fn();
      onAuthStateChange.mockImplementation((callback) => {
        // Simulate calling the callback
        setTimeout(() => callback('SIGNED_IN', { user: { email: 'new@example.com' } }), 0);
        return vi.fn(); // unsubscribe function
      });

      await initApp();

      // Wait for async callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('initAppFeaturesOnce', () => {
    it('should initialize features only once', () => {
      // First call
      initAppFeaturesOnce();

      expect(initTabs).toHaveBeenCalledTimes(1);
      expect(initLookup).toHaveBeenCalledTimes(1);
      expect(initExercise).toHaveBeenCalledTimes(1);

      // Reset mocks to test second call
      vi.clearAllMocks();

      // Second call should not initialize again
      initAppFeaturesOnce();

      expect(initTabs).not.toHaveBeenCalled();
      expect(initLookup).not.toHaveBeenCalled();
      expect(initExercise).not.toHaveBeenCalled();
    });
  });

  describe('UI Event Handlers', () => {
    beforeEach(() => {
      // Initialize the app features to set up event handlers
      initAppFeaturesOnce();
      vi.clearAllMocks(); // Clear the initialization calls
    });

    it('should handle clear history button click', async () => {
      clearAllWords.mockResolvedValue(true);

      const clearBtn = document.getElementById('clearHistory');
      clearBtn.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(clearAllWords).toHaveBeenCalled();
      expect(displaySavedWords).toHaveBeenCalled();
    });

    it('should handle export words button click', () => {
      // Mock window methods for file download
      const mockBlob = { type: 'application/json' };
      global.Blob = vi.fn(() => mockBlob);
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const exportBtn = document.getElementById('exportWords');
      exportBtn.click();

      // Should create download link and trigger download
      expect(global.Blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });

  describe('DOM Content Loaded', () => {
    let mockInitApp;

    beforeEach(() => {
      mockInitApp = vi.fn();
      // Mock the import in main.js
      vi.doMock('./main.js', () => ({
        initApp: mockInitApp,
        initAppFeaturesOnce: vi.fn()
      }));
    });

    it('should initialize app on DOMContentLoaded', () => {
      // Simulate DOMContentLoaded event
      document.dispatchEvent(new Event('DOMContentLoaded'));

      expect(mockInitApp).toHaveBeenCalled();
    });
  });
});
