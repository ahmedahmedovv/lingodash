import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSavedWords, saveWord, deleteWord, clearAllWords, updateWordReview, getWordsDueForReview } from './storage.js';

describe('Storage Functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getSavedWords', () => {
    it('should return empty array when no words are saved', () => {
      const words = getSavedWords();
      expect(words).toEqual([]);
    });

    it('should return saved words from localStorage', () => {
      const mockWords = [
        { word: 'test', definition: 'a test', timestamp: new Date().toISOString() }
      ];
      localStorage.setItem('lingodash_words', JSON.stringify(mockWords));
      
      const words = getSavedWords();
      expect(words).toEqual(mockWords);
    });
  });

  describe('saveWord', () => {
    it('should save a new word to localStorage', () => {
      saveWord('hello', 'a greeting', 'Hello, how are you?');
      
      const words = getSavedWords();
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('hello');
      expect(words[0].definition).toBe('a greeting');
      expect(words[0].example).toBe('Hello, how are you?');
    });

    it('should add new word at the beginning', () => {
      saveWord('first', 'first word');
      saveWord('second', 'second word');
      
      const words = getSavedWords();
      expect(words[0].word).toBe('second');
      expect(words[1].word).toBe('first');
    });

    it('should remove duplicate words (case insensitive)', () => {
      saveWord('test', 'first definition');
      saveWord('TEST', 'second definition');
      
      const words = getSavedWords();
      expect(words).toHaveLength(1);
      expect(words[0].definition).toBe('second definition');
    });

    it('should add default example if not provided', () => {
      saveWord('word', 'definition');
      
      const words = getSavedWords();
      expect(words[0].example).toContain('Example sentence with "word"');
    });

    it('should limit to 50 words', () => {
      // Add 51 words
      for (let i = 0; i < 51; i++) {
        saveWord(`word${i}`, `definition${i}`);
      }
      
      const words = getSavedWords();
      expect(words).toHaveLength(50);
      expect(words[0].word).toBe('word50'); // Most recent
      expect(words[49].word).toBe('word1'); // Oldest kept
    });
  });

  describe('deleteWord', () => {
    it('should delete a word from localStorage', () => {
      saveWord('hello', 'greeting');
      saveWord('world', 'earth');
      
      deleteWord('hello');
      
      const words = getSavedWords();
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('world');
    });

    it('should be case insensitive', () => {
      saveWord('Test', 'a test');
      deleteWord('test');
      
      const words = getSavedWords();
      expect(words).toHaveLength(0);
    });
  });

  describe('clearAllWords', () => {
    it('should clear all words when user confirms', () => {
      // Mock window.confirm to return true
      global.confirm = vi.fn(() => true);
      
      saveWord('word1', 'def1');
      saveWord('word2', 'def2');
      
      const result = clearAllWords();
      
      expect(result).toBe(true);
      expect(getSavedWords()).toEqual([]);
      expect(global.confirm).toHaveBeenCalled();
    });

    it('should not clear words when user cancels', () => {
      // Mock window.confirm to return false
      global.confirm = vi.fn(() => false);
      
      saveWord('word1', 'def1');
      
      const result = clearAllWords();
      
      expect(result).toBe(false);
      expect(getSavedWords()).toHaveLength(1);
    });
  });

  describe('Spaced Repetition', () => {
    describe('saveWord with spaced repetition data', () => {
      it('should initialize new words with spaced repetition data', () => {
        saveWord('test', 'a test word', 'This is a test.');
        
        const words = getSavedWords();
        expect(words[0].interval).toBe(0);
        expect(words[0].easeFactor).toBe(2.5);
        expect(words[0].reviewCount).toBe(0);
        expect(words[0].correctCount).toBe(0);
        expect(words[0].nextReview).toBeDefined();
      });

      it('should preserve spaced repetition data when updating existing word', () => {
        saveWord('test', 'first definition', 'Example 1');
        
        // Update the word's review data
        updateWordReview('test', true);
        
        const wordsAfterReview = getSavedWords();
        const reviewCount = wordsAfterReview[0].reviewCount;
        const interval = wordsAfterReview[0].interval;
        
        // Save the word again with new definition
        saveWord('test', 'updated definition', 'Example 2');
        
        const words = getSavedWords();
        expect(words[0].definition).toBe('updated definition');
        expect(words[0].reviewCount).toBe(reviewCount); // Preserved
        expect(words[0].interval).toBe(interval); // Preserved
      });
    });

    describe('updateWordReview', () => {
      beforeEach(() => {
        saveWord('test', 'a test word', 'This is a test.');
      });

      it('should increase interval on correct answer', () => {
        updateWordReview('test', true);
        
        const words = getSavedWords();
        expect(words[0].interval).toBe(1); // First correct: 1 day
        expect(words[0].correctCount).toBe(1);
        expect(words[0].reviewCount).toBe(1);
      });

      it('should reset interval on incorrect answer', () => {
        // First correct answer
        updateWordReview('test', true);
        let words = getSavedWords();
        expect(words[0].interval).toBe(1);
        
        // Incorrect answer should reset
        updateWordReview('test', false);
        words = getSavedWords();
        expect(words[0].interval).toBe(0);
        expect(words[0].reviewCount).toBe(2);
      });

      it('should increase ease factor on correct answers', () => {
        updateWordReview('test', true);
        
        const words = getSavedWords();
        expect(words[0].easeFactor).toBeGreaterThan(2.5);
      });

      it('should decrease ease factor on incorrect answers', () => {
        updateWordReview('test', false);
        
        const words = getSavedWords();
        expect(words[0].easeFactor).toBeLessThan(2.5);
      });

      it('should follow interval progression on consecutive correct answers', () => {
        // First correct: interval = 1
        updateWordReview('test', true);
        let words = getSavedWords();
        expect(words[0].interval).toBe(1);
        
        // Second correct: interval = 3
        updateWordReview('test', true);
        words = getSavedWords();
        expect(words[0].interval).toBe(3);
        
        // Third correct: interval multiplied by easeFactor
        updateWordReview('test', true);
        words = getSavedWords();
        expect(words[0].interval).toBeGreaterThan(3);
      });

      it('should cap ease factor at 3.0', () => {
        // Answer correctly many times
        for (let i = 0; i < 20; i++) {
          updateWordReview('test', true);
        }
        
        const words = getSavedWords();
        expect(words[0].easeFactor).toBeLessThanOrEqual(3.0);
      });

      it('should not let ease factor go below 1.3', () => {
        // Answer incorrectly many times
        for (let i = 0; i < 20; i++) {
          updateWordReview('test', false);
        }
        
        const words = getSavedWords();
        expect(words[0].easeFactor).toBeGreaterThanOrEqual(1.3);
      });

      it('should handle case insensitive word matching', () => {
        updateWordReview('TEST', true);
        
        const words = getSavedWords();
        expect(words[0].reviewCount).toBe(1);
      });
    });

    describe('getWordsDueForReview', () => {
      it('should return all new words without review data', () => {
        saveWord('word1', 'def1', 'ex1');
        saveWord('word2', 'def2', 'ex2');
        
        const dueWords = getWordsDueForReview();
        expect(dueWords).toHaveLength(2);
      });

      it('should return words with past nextReview dates', () => {
        saveWord('word1', 'def1', 'ex1');
        
        // Manually set nextReview to past
        const words = getSavedWords();
        words[0].nextReview = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
        localStorage.setItem('lingodash_words', JSON.stringify(words));
        
        const dueWords = getWordsDueForReview();
        expect(dueWords).toHaveLength(1);
      });

      it('should not return words with future nextReview dates', () => {
        saveWord('word1', 'def1', 'ex1');
        
        // Set nextReview to future
        const words = getSavedWords();
        words[0].nextReview = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
        localStorage.setItem('lingodash_words', JSON.stringify(words));
        
        const dueWords = getWordsDueForReview();
        expect(dueWords).toHaveLength(0);
      });

      it('should sort words by review date (most overdue first)', () => {
        saveWord('word1', 'def1', 'ex1');
        saveWord('word2', 'def2', 'ex2');
        saveWord('word3', 'def3', 'ex3');
        
        const words = getSavedWords();
        // Words are stored in reverse order (most recent first)
        // words[0] = word3, words[1] = word2, words[2] = word1
        // Set different review dates
        words[0].nextReview = new Date(Date.now() - 259200000).toISOString(); // word3: 3 days ago
        words[1].nextReview = new Date(Date.now() - 86400000).toISOString(); // word2: 1 day ago
        words[2].nextReview = new Date(Date.now() - 172800000).toISOString(); // word1: 2 days ago
        localStorage.setItem('lingodash_words', JSON.stringify(words));
        
        const dueWords = getWordsDueForReview();
        expect(dueWords[0].word).toBe('word3'); // Most overdue (3 days)
        expect(dueWords[1].word).toBe('word1'); // 2 days
        expect(dueWords[2].word).toBe('word2'); // 1 day
      });
    });
  });
});
