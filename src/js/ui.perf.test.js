import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage module before importing ui
vi.mock('./storage.js', () => ({
    getSavedWordsPaginated: vi.fn(),
    deleteWord: vi.fn(),
    updateWord: vi.fn(),
    exportWords: vi.fn()
}));

import { displaySavedWords } from './ui.js';
import * as storage from './storage.js';

describe('UI Performance Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `
            <div id="savedWordsList"></div>
            <div id="paginationControls"></div>
        `;
    });

    it('should render 50 words within acceptable time', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            word: `word${i}`,
            definition: `This is definition number ${i} with some decent length to simulate real data`,
            example: `This is an example sentence for word${i} that shows it in context`,
            timestamp: new Date().toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });

        const startTime = performance.now();
        await displaySavedWords();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);

        const listElement = document.getElementById('savedWordsList');
        expect(listElement.children.length).toBeGreaterThan(0);
    });

    it('should handle rapid re-renders efficiently', async () => {
        const mockWords = Array.from({ length: 20 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example ${i}`,
            timestamp: new Date().toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });

        const iterations = 50;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            await displaySavedWords();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / iterations;

        expect(avgDuration).toBeLessThan(10);
    });

    it('should efficiently render with long content', async () => {
        const mockWords = Array.from({ length: 30 }, (_, i) => ({
            word: `word${i}`,
            definition: 'A'.repeat(500),
            example: 'B'.repeat(300),
            timestamp: new Date().toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });

        const startTime = performance.now();
        await displaySavedWords();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(150);
    });

    it('should handle empty state rendering quickly', async () => {
        storage.getSavedWordsPaginated.mockResolvedValue({
            words: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1
        });

        const iterations = 100;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            await displaySavedWords();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / iterations;

        expect(avgDuration).toBeLessThan(2);
    });

    it('should efficiently add event listeners', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example ${i}`,
            timestamp: new Date().toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });
        storage.deleteWord.mockResolvedValue(true);

        const startTime = performance.now();
        await displaySavedWords();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);

        // Verify event listeners work
        const deleteButtons = document.querySelectorAll('.delete-btn');
        expect(deleteButtons.length).toBe(50);
    });

    it('should handle special characters efficiently', async () => {
        const mockWords = Array.from({ length: 30 }, (_, i) => ({
            word: `word-${i}`,
            definition: `Definition with "quotes" and 'apostrophes' & special chars: <>&`,
            example: `Example with ${i} emojis and unicode: náéíóú`,
            timestamp: new Date().toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });

        const startTime = performance.now();
        await displaySavedWords();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);
    });

    it('should measure DOM manipulation overhead', async () => {
        const mockWords = Array.from({ length: 40 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example ${i}`,
            timestamp: new Date().toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });

        // First render
        const firstRenderStart = performance.now();
        await displaySavedWords();
        const firstRenderEnd = performance.now();
        const firstRenderDuration = firstRenderEnd - firstRenderStart;

        // Second render (should be similar speed)
        const secondRenderStart = performance.now();
        await displaySavedWords();
        const secondRenderEnd = performance.now();
        const secondRenderDuration = secondRenderEnd - secondRenderStart;

        // Both should be reasonably fast
        expect(firstRenderDuration).toBeLessThan(100);
        expect(secondRenderDuration).toBeLessThan(100);
    });

    it('should handle date formatting performance', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example ${i}`,
            timestamp: new Date(Date.now() - i * 86400000).toISOString()
        }));

        storage.getSavedWordsPaginated.mockResolvedValue({
            words: mockWords,
            totalCount: mockWords.length,
            totalPages: 1,
            currentPage: 1
        });

        const startTime = performance.now();
        await displaySavedWords();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);
    });
});
