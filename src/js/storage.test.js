import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSavedWords, saveWord, deleteWord, clearAllWords } from './storage.js';

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
});
