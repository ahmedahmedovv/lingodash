import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
vi.mock('./supabase.js', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null }))
        }
    },
    getUserId: vi.fn(() => Promise.resolve('test-user-id'))
}));

import { getSavedWords, saveWord, deleteWord } from './storage/index.js';
import { supabase } from './supabase.js';

describe('Storage Performance Tests', () => {
    let mockData = [];
    let mockChain;

    beforeEach(() => {
        vi.clearAllMocks();
        mockData = [];

        mockChain = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockImplementation((data) => {
                mockData.push(data);
                return Promise.resolve({ error: null });
            }),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockImplementation((field, value) => {
                mockData = mockData.filter(w =>
                    w.word?.toLowerCase() !== value.toLowerCase()
                );
                return Promise.resolve({ error: null });
            }),
            lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockImplementation(() => {
                return Promise.resolve({ data: mockData.slice(0, 50), error: null });
            }),
        };

        supabase.from.mockReturnValue(mockChain);
    });

    it('should handle 50 async saves within acceptable time', async () => {
        // Mock for checking existing words and inserting new ones
        mockChain.limit.mockImplementation(() =>
            Promise.resolve({ data: [], error: null })
        );

        const startTime = performance.now();

        const promises = [];
        for (let i = 0; i < 50; i++) {
            promises.push(saveWord(`word${i}`, `definition for word ${i}`, `Example with word${i}`));
        }
        await Promise.all(promises);

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500); // Async operations need more time
        expect(supabase.from).toHaveBeenCalled();
    });

    it('should retrieve words quickly', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            id: `${i}`,
            word: `word${i}`,
            definition: `definition ${i}`,
            example: `example ${i}`,
            timestamp: new Date().toISOString()
        }));
        mockChain.limit.mockResolvedValue({ data: mockWords, error: null });

        const iterations = 100;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            await getSavedWords();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / iterations;

        expect(avgDuration).toBeLessThan(5); // Should average less than 5ms per call
    });

    it('should delete words efficiently', async () => {
        mockChain.ilike.mockResolvedValue({ error: null });

        const startTime = performance.now();

        const promises = [];
        for (let i = 0; i < 25; i++) {
            promises.push(deleteWord(`word${i}`));
        }
        await Promise.all(promises);

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(200);
    });

    it('should handle duplicate word updates efficiently', async () => {
        const existingWord = { id: '1', word: 'test', definition: 'old' };
        mockChain.limit.mockResolvedValue({ data: [existingWord], error: null });
        mockChain.eq.mockResolvedValue({ error: null });

        const iterations = 50;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            await saveWord('test', `definition ${i}`, `example ${i}`);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500);
    });

    it('should handle rapid consecutive saves', async () => {
        mockChain.limit.mockResolvedValue({ data: [], error: null });

        const startTime = performance.now();

        const promises = [];
        for (let i = 0; i < 20; i++) {
            promises.push(saveWord(`word${i}`, `def${i}`, `ex${i}`));
        }
        await Promise.all(promises);

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(300);
    });

    it('should maintain performance with large definitions', async () => {
        const longDefinition = 'A'.repeat(1000);
        const longExample = 'B'.repeat(500);

        mockChain.limit.mockResolvedValue({ data: [], error: null });

        const startTime = performance.now();

        const promises = [];
        for (let i = 0; i < 30; i++) {
            promises.push(saveWord(`word${i}`, longDefinition, longExample));
        }
        await Promise.all(promises);

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500);
    });

    it('should handle case-insensitive operations efficiently', async () => {
        const existingWord = { id: '1', word: 'Test', definition: 'def' };
        mockChain.limit.mockResolvedValue({ data: [existingWord], error: null });
        mockChain.eq.mockResolvedValue({ error: null });

        const iterations = 50;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            await saveWord('TEST', `definition ${i}`, `example ${i}`);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500);
    });

    it('should handle JSON serialization performance', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            id: `${i}`,
            word: `word${i}`,
            definition: `This is a complex definition with special characters: !@#$%^&*() ${i}`,
            example: `Example sentence with "quotes" and 'apostrophes' ${i}`,
            timestamp: new Date().toISOString()
        }));
        mockChain.limit.mockResolvedValue({ data: mockWords, error: null });

        const startTime = performance.now();

        for (let i = 0; i < 100; i++) {
            const words = await getSavedWords();
            expect(words).toBeDefined();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500);
    });

    it('should measure data size impact', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            id: `${i}`,
            word: `word${i}`,
            definition: `Definition: ${'A'.repeat(100)}`,
            example: `Example: ${'B'.repeat(100)}`,
            timestamp: new Date().toISOString()
        }));
        mockChain.limit.mockResolvedValue({ data: mockWords, error: null });

        const words = await getSavedWords();
        const sizeInBytes = new Blob([JSON.stringify(words)]).size;
        const sizeInKB = sizeInBytes / 1024;

        // Should be reasonable size (under 50KB for 50 words)
        expect(sizeInKB).toBeLessThan(50);

        console.log(`Storage size for 50 words: ${sizeInKB.toFixed(2)} KB`);
    });

    it('should efficiently retrieve large datasets', async () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            id: `${i}`,
            word: `word${i}`,
            definition: 'A'.repeat(200),
            example: 'B'.repeat(100),
            timestamp: new Date().toISOString()
        }));
        mockChain.limit.mockResolvedValue({ data: mockWords, error: null });

        const iterations = 50;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const words = await getSavedWords();
            expect(words.length).toBe(50);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(300);
    });
});
