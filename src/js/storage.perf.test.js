import { describe, it, expect, beforeEach } from 'vitest';
import { getSavedWords, saveWord, deleteWord } from './storage.js';

describe('Storage Performance Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save 50 words within acceptable time', () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 50; i++) {
      saveWord(`word${i}`, `definition for word ${i}`, `Example with word${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    expect(getSavedWords().length).toBe(50);
  });

  it('should retrieve 50 words quickly', () => {
    // Setup: save 50 words
    for (let i = 0; i < 50; i++) {
      saveWord(`word${i}`, `definition ${i}`, `example ${i}`);
    }
    
    const iterations = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      getSavedWords();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgDuration = duration / iterations;
    
    expect(avgDuration).toBeLessThan(1); // Should average less than 1ms per call
  });

  it('should delete words efficiently', () => {
    // Setup: save 50 words
    for (let i = 0; i < 50; i++) {
      saveWord(`word${i}`, `definition ${i}`, `example ${i}`);
    }
    
    const startTime = performance.now();
    
    // Delete 25 words
    for (let i = 0; i < 25; i++) {
      deleteWord(`word${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    expect(getSavedWords().length).toBe(25);
  });

  it('should handle duplicate word updates efficiently', () => {
    const wordName = 'test';
    const iterations = 100;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      saveWord(wordName, `definition ${i}`, `example ${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(200); // Should complete in less than 200ms
    expect(getSavedWords().length).toBe(1); // Should only have 1 word (not 100)
  });

  it('should handle rapid consecutive saves', () => {
    const startTime = performance.now();
    
    // Rapidly save different words
    for (let i = 0; i < 20; i++) {
      saveWord(`word${i}`, `def${i}`, `ex${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(50);
    expect(getSavedWords().length).toBe(20);
  });

  it('should maintain performance with large definitions', () => {
    const longDefinition = 'A'.repeat(1000); // 1000 character definition
    const longExample = 'B'.repeat(500); // 500 character example
    
    const startTime = performance.now();
    
    for (let i = 0; i < 30; i++) {
      saveWord(`word${i}`, longDefinition, longExample);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(150);
    
    // Verify data integrity
    const words = getSavedWords();
    expect(words[0].definition).toHaveLength(1000);
    expect(words[0].example).toHaveLength(500);
  });

  it('should efficiently enforce 50 word limit', () => {
    const startTime = performance.now();
    
    // Try to save 100 words
    for (let i = 0; i < 100; i++) {
      saveWord(`word${i}`, `definition ${i}`, `example ${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(200);
    expect(getSavedWords().length).toBe(50);
    
    // Verify we kept the most recent 50
    const words = getSavedWords();
    expect(words[0].word).toBe('word99'); // Most recent
    expect(words[49].word).toBe('word50'); // Oldest kept
  });

  it('should handle case-insensitive operations efficiently', () => {
    saveWord('Test', 'definition 1', 'example 1');
    
    const iterations = 50;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      saveWord('TEST', `definition ${i}`, `example ${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100);
    expect(getSavedWords().length).toBe(1);
  });

  it('should handle JSON serialization performance', () => {
    // Save 50 words with complex data
    for (let i = 0; i < 50; i++) {
      saveWord(
        `word${i}`,
        `This is a complex definition with special characters: !@#$%^&*() ${i}`,
        `Example sentence with "quotes" and 'apostrophes' ${i}`
      );
    }
    
    const startTime = performance.now();
    
    // Perform multiple reads which involve JSON parsing
    for (let i = 0; i < 100; i++) {
      const words = getSavedWords();
      expect(words).toBeDefined();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // 100 reads should be fast
  });

  it('should measure localStorage size impact', () => {
    // Save 50 words
    for (let i = 0; i < 50; i++) {
      saveWord(
        `word${i}`,
        `Definition: ${'A'.repeat(100)}`,
        `Example: ${'B'.repeat(100)}`
      );
    }
    
    const storageData = localStorage.getItem('lingodash_words');
    const sizeInBytes = new Blob([storageData]).size;
    const sizeInKB = sizeInBytes / 1024;
    
    // Should be reasonable size (under 50KB for 50 words)
    expect(sizeInKB).toBeLessThan(50);
    
    console.log(`Storage size for 50 words: ${sizeInKB.toFixed(2)} KB`);
  });
});
