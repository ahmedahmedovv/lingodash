import { describe, it, expect, beforeEach, vi } from 'vitest';
import { displaySavedWords } from './ui.js';
import * as storage from './storage.js';

describe('UI Performance Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="savedWordsList"></div>
    `;
  });

  it('should render 50 words within acceptable time', () => {
    // Mock 50 words
    const mockWords = Array.from({ length: 50 }, (_, i) => ({
      word: `word${i}`,
      definition: `This is definition number ${i} with some decent length to simulate real data`,
      example: `This is an example sentence for word${i} that shows it in context`,
      timestamp: new Date().toISOString()
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);

    const startTime = performance.now();
    displaySavedWords();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should render in less than 100ms
    
    const listElement = document.getElementById('savedWordsList');
    expect(listElement.children.length).toBeGreaterThan(0);
  });

  it('should handle rapid re-renders efficiently', () => {
    const mockWords = Array.from({ length: 20 }, (_, i) => ({
      word: `word${i}`,
      definition: `Definition ${i}`,
      example: `Example ${i}`,
      timestamp: new Date().toISOString()
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);

    const iterations = 50;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      displaySavedWords();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgDuration = duration / iterations;

    expect(avgDuration).toBeLessThan(5); // Average less than 5ms per render
  });

  it('should efficiently render with long content', () => {
    const mockWords = Array.from({ length: 30 }, (_, i) => ({
      word: `word${i}`,
      definition: 'A'.repeat(500), // Long definition
      example: 'B'.repeat(300), // Long example
      timestamp: new Date().toISOString()
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);

    const startTime = performance.now();
    displaySavedWords();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(150);
  });

  it('should handle empty state rendering quickly', () => {
    vi.spyOn(storage, 'getSavedWords').mockReturnValue([]);

    const iterations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      displaySavedWords();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgDuration = duration / iterations;

    expect(avgDuration).toBeLessThan(0.5); // Should be very fast
  });

  it('should efficiently add event listeners', () => {
    const mockWords = Array.from({ length: 50 }, (_, i) => ({
      word: `word${i}`,
      definition: `Definition ${i}`,
      example: `Example ${i}`,
      timestamp: new Date().toISOString()
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);
    vi.spyOn(storage, 'deleteWord').mockImplementation(() => {});

    const startTime = performance.now();
    displaySavedWords();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);

    // Verify event listeners work
    const deleteButtons = document.querySelectorAll('.delete-btn');
    expect(deleteButtons.length).toBe(50);
  });

  it('should handle special characters efficiently', () => {
    const mockWords = Array.from({ length: 30 }, (_, i) => ({
      word: `word-${i}`,
      definition: `Definition with "quotes" and 'apostrophes' & special chars: <>&`,
      example: `Example with ${i} emojis 🎉🚀✨ and unicode: ñáéíóú`,
      timestamp: new Date().toISOString()
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);

    const startTime = performance.now();
    displaySavedWords();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);
  });

  it('should measure DOM manipulation overhead', () => {
    const mockWords = Array.from({ length: 40 }, (_, i) => ({
      word: `word${i}`,
      definition: `Definition ${i}`,
      example: `Example ${i}`,
      timestamp: new Date().toISOString()
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);

    // First render
    const firstRenderStart = performance.now();
    displaySavedWords();
    const firstRenderEnd = performance.now();
    const firstRenderDuration = firstRenderEnd - firstRenderStart;

    // Second render (should be similar speed)
    const secondRenderStart = performance.now();
    displaySavedWords();
    const secondRenderEnd = performance.now();
    const secondRenderDuration = secondRenderEnd - secondRenderStart;

    // Both should be reasonably fast
    expect(firstRenderDuration).toBeLessThan(100);
    expect(secondRenderDuration).toBeLessThan(100);
  });

  it('should handle date formatting performance', () => {
    const mockWords = Array.from({ length: 50 }, (_, i) => ({
      word: `word${i}`,
      definition: `Definition ${i}`,
      example: `Example ${i}`,
      timestamp: new Date(Date.now() - i * 86400000).toISOString() // Different dates
    }));

    vi.spyOn(storage, 'getSavedWords').mockReturnValue(mockWords);

    const startTime = performance.now();
    displaySavedWords();
    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);
  });
});
