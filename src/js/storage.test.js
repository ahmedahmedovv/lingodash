import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase before importing storage
vi.mock('./supabase.js', () => ({
    supabase: {
        from: vi.fn()
    },
    getUserId: vi.fn(() => 'test-user-id')
}));

import { getSavedWords, saveWord, deleteWord, clearAllWords, updateWordReview, getWordsDueForReview } from './storage.js';
import { supabase } from './supabase.js';

describe('Storage Functions', () => {
    // Helper to create a chainable mock
    function createMockChain(finalResult) {
        const chain = {
            select: vi.fn(() => chain),
            insert: vi.fn(() => Promise.resolve(finalResult)),
            update: vi.fn(() => chain),
            delete: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            ilike: vi.fn(() => chain),
            lte: vi.fn(() => chain),
            in: vi.fn(() => chain),
            order: vi.fn(() => chain),
            limit: vi.fn(() => Promise.resolve(finalResult)),
        };
        return chain;
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSavedWords', () => {
        it('should return empty array when no words are saved', async () => {
            const mockChain = createMockChain({ data: [], error: null });
            supabase.from.mockReturnValue(mockChain);

            const words = await getSavedWords();
            expect(words).toEqual([]);
            expect(supabase.from).toHaveBeenCalledWith('words');
        });

        it('should return saved words from Supabase', async () => {
            const mockData = [
                {
                    id: '1',
                    word: 'test',
                    definition: 'a test',
                    example: 'Test example',
                    timestamp: new Date().toISOString(),
                    interval: 0,
                    ease_factor: 2.5,
                    next_review: new Date().toISOString(),
                    review_count: 0,
                    correct_count: 0
                }
            ];
            const mockChain = createMockChain({ data: mockData, error: null });
            supabase.from.mockReturnValue(mockChain);

            const words = await getSavedWords();
            expect(words).toHaveLength(1);
            expect(words[0].word).toBe('test');
            expect(words[0].definition).toBe('a test');
        });

        it('should handle Supabase errors gracefully', async () => {
            const mockChain = createMockChain({ data: null, error: { message: 'Database error' } });
            supabase.from.mockReturnValue(mockChain);

            const words = await getSavedWords();
            expect(words).toEqual([]);
        });
    });

    describe('saveWord', () => {
        it('should save a new word to Supabase', async () => {
            // First call: check existing word (returns empty)
            const checkChain = createMockChain({ data: [], error: null });
            // Second call: insert new word
            const insertChain = createMockChain({ error: null });
            // Third call: cleanup check
            const cleanupChain = createMockChain({ data: [], error: null });

            supabase.from
                .mockReturnValueOnce(checkChain)
                .mockReturnValueOnce(insertChain)
                .mockReturnValueOnce(cleanupChain);

            const result = await saveWord('hello', 'a greeting', 'Hello, how are you?');

            expect(result).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('words');
        });

        it('should update existing word', async () => {
            const existingWord = {
                id: '123',
                word: 'hello',
                definition: 'old definition',
                example: 'old example'
            };

            // First call: check existing word (returns existing)
            const checkChain = createMockChain({ data: [existingWord], error: null });
            // Second call: update word - eq returns the promise
            const updateChain = createMockChain({ error: null });
            updateChain.eq = vi.fn(() => Promise.resolve({ error: null }));

            supabase.from
                .mockReturnValueOnce(checkChain)
                .mockReturnValueOnce(updateChain);

            const result = await saveWord('hello', 'new definition', 'new example');

            expect(result).toBe(true);
        });

        it('should return false on error', async () => {
            const mockChain = createMockChain({ data: null, error: { message: 'Error' } });
            supabase.from.mockReturnValue(mockChain);

            const result = await saveWord('test', 'definition');

            expect(result).toBe(false);
        });
    });

    describe('deleteWord', () => {
        it('should delete a word from Supabase', async () => {
            const mockChain = createMockChain({ error: null });
            mockChain.ilike = vi.fn(() => Promise.resolve({ error: null }));
            supabase.from.mockReturnValue(mockChain);

            const result = await deleteWord('hello');

            expect(result).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('words');
        });

        it('should return false on error', async () => {
            const mockChain = createMockChain({ error: null });
            mockChain.ilike = vi.fn(() => Promise.resolve({ error: { message: 'Delete error' } }));
            supabase.from.mockReturnValue(mockChain);

            const result = await deleteWord('hello');

            expect(result).toBe(false);
        });
    });

    describe('clearAllWords', () => {
        it('should clear all words when user confirms', async () => {
            global.confirm = vi.fn(() => true);
            const mockChain = createMockChain({ error: null });
            mockChain.eq = vi.fn(() => Promise.resolve({ error: null }));
            supabase.from.mockReturnValue(mockChain);

            const result = await clearAllWords();

            expect(result).toBe(true);
            expect(global.confirm).toHaveBeenCalled();
        });

        it('should not clear words when user cancels', async () => {
            global.confirm = vi.fn(() => false);

            const result = await clearAllWords();

            expect(result).toBe(false);
        });
    });

    describe('Spaced Repetition', () => {
        describe('updateWordReview', () => {
            it('should update word on correct answer', async () => {
                const existingWord = {
                    id: '123',
                    word: 'test',
                    interval: 0,
                    ease_factor: 2.5,
                    review_count: 0,
                    correct_count: 0
                };

                // First call: find word
                const findChain = createMockChain({ data: [existingWord], error: null });
                // Second call: update word
                const updateChain = createMockChain({ error: null });
                updateChain.eq = vi.fn(() => Promise.resolve({ error: null }));

                supabase.from
                    .mockReturnValueOnce(findChain)
                    .mockReturnValueOnce(updateChain);

                const result = await updateWordReview('test', true);

                expect(result).toBe(true);
            });

            it('should update word on incorrect answer', async () => {
                const existingWord = {
                    id: '123',
                    word: 'test',
                    interval: 3,
                    ease_factor: 2.5,
                    review_count: 2,
                    correct_count: 2
                };

                const findChain = createMockChain({ data: [existingWord], error: null });
                const updateChain = createMockChain({ error: null });
                updateChain.eq = vi.fn(() => Promise.resolve({ error: null }));

                supabase.from
                    .mockReturnValueOnce(findChain)
                    .mockReturnValueOnce(updateChain);

                const result = await updateWordReview('test', false);

                expect(result).toBe(true);
            });

            it('should return false when word not found', async () => {
                const findChain = createMockChain({ data: [], error: null });
                supabase.from.mockReturnValue(findChain);

                const result = await updateWordReview('nonexistent', true);

                expect(result).toBe(false);
            });

            it('should handle case insensitive word matching', async () => {
                const existingWord = {
                    id: '123',
                    word: 'Test',
                    interval: 0,
                    ease_factor: 2.5,
                    review_count: 0,
                    correct_count: 0
                };

                const findChain = createMockChain({ data: [existingWord], error: null });
                const updateChain = createMockChain({ error: null });
                updateChain.eq = vi.fn(() => Promise.resolve({ error: null }));

                supabase.from
                    .mockReturnValueOnce(findChain)
                    .mockReturnValueOnce(updateChain);

                const result = await updateWordReview('TEST', true);

                expect(result).toBe(true);
                expect(findChain.ilike).toHaveBeenCalledWith('word', 'TEST');
            });
        });

        describe('getWordsDueForReview', () => {
            it('should return words due for review', async () => {
                const dueWords = [
                    {
                        id: '1',
                        word: 'word1',
                        definition: 'def1',
                        example: 'ex1',
                        timestamp: new Date().toISOString(),
                        interval: 0,
                        ease_factor: 2.5,
                        next_review: new Date(Date.now() - 86400000).toISOString(),
                        review_count: 0,
                        correct_count: 0
                    }
                ];
                const mockChain = createMockChain({ data: dueWords, error: null });
                mockChain.order = vi.fn(() => Promise.resolve({ data: dueWords, error: null }));
                supabase.from.mockReturnValue(mockChain);

                const result = await getWordsDueForReview();

                expect(result).toHaveLength(1);
                expect(result[0].word).toBe('word1');
            });

            it('should return empty array on error', async () => {
                const mockChain = createMockChain({ data: null, error: { message: 'Error' } });
                mockChain.order = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Error' } }));
                supabase.from.mockReturnValue(mockChain);

                const result = await getWordsDueForReview();

                expect(result).toEqual([]);
            });
        });
    });
});
