import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWordDefinition } from './api.js';

// Mock storage module before importing api
vi.mock('./storage.js', () => ({
    getWordIfExists: vi.fn()
}));

import { getWordIfExists } from './storage.js';

describe('API Functions', () => {
    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = vi.fn();
        // Reset storage mock - default to null (word not in Supabase)
        vi.mocked(getWordIfExists).mockResolvedValue(null);
    });

    describe('getWordDefinition', () => {
        it('should return null for empty word', async () => {
            const result = await getWordDefinition('');
            expect(result).toBeNull();
            expect(getWordIfExists).not.toHaveBeenCalled();
        });

        it('should return null for whitespace-only word', async () => {
            const result = await getWordDefinition('   ');
            expect(result).toBeNull();
            expect(getWordIfExists).not.toHaveBeenCalled();
        });

        it('should return word from Supabase if it exists', async () => {
            const existingWord = {
                word: 'hello',
                definition: 'A greeting from Supabase',
                example: 'Hello from collection'
            };
            vi.mocked(getWordIfExists).mockResolvedValueOnce(existingWord);

            const result = await getWordDefinition('hello');

            expect(result).toEqual({
                word: 'hello',
                definition: 'A greeting from Supabase',
                example: 'Hello from collection',
                fromSupabase: true
            });
            expect(getWordIfExists).toHaveBeenCalledWith('hello');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should fetch definition from API', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Definition: A greeting\nExample: Hello, world!'
                    }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await getWordDefinition('hello');

            expect(result).toEqual({
                word: 'hello',
                definition: 'A greeting',
                example: 'Hello, world!',
                fromSupabase: false
            });
            expect(getWordIfExists).toHaveBeenCalledWith('hello');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle API response without proper format', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Just a simple definition without format'
                    }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await getWordDefinition('test');

            expect(result.word).toBe('test');
            expect(result.definition).toBe('Just a simple definition without format');
            expect(result.example).toBe('');
            expect(result.fromSupabase).toBe(false);
        });

        it('should handle API errors with status 401', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ message: 'Unauthorized' })
            });

            await expect(getWordDefinition('test')).rejects.toThrow(
                'API authentication failed'
            );
        });

        it('should handle API errors with status 429 after retries', async () => {
            // Mock 4 failed responses (initial + 3 retries)
            for (let i = 0; i < 4; i++) {
                global.fetch.mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    json: async () => ({ message: 'Rate limit exceeded' })
                });
            }

            await expect(getWordDefinition('test')).rejects.toThrow(
                'API quota exceeded'
            );

            // Should check Supabase first, then retry 3 times (4 total calls)
            expect(getWordIfExists).toHaveBeenCalledWith('test');
            expect(global.fetch).toHaveBeenCalledTimes(4);
        }, 15000); // Increase timeout for retry delays

        it('should handle network errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(getWordDefinition('test')).rejects.toThrow();
        });

        it('should send correct API request format', async () => {
            const mockResponse = {
                choices: [{
                    message: { content: 'Definition: test\nExample: test' }
                }]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await getWordDefinition('hello');

            expect(getWordIfExists).toHaveBeenCalledWith('hello');
            const [url, options] = global.fetch.mock.calls[0];

            expect(url).toContain('mistral.ai');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.headers['Authorization']).toContain('Bearer');

            const body = JSON.parse(options.body);
            expect(body.model).toBe('mistral-large-latest');
            expect(body.messages[0].role).toBe('user');
            expect(body.messages[0].content).toContain('hello');
        });
    });
});
