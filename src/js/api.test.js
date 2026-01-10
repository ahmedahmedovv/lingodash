import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWordDefinition } from './api.js';

describe('API Functions', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  describe('getWordDefinition', () => {
    it('should return null for empty word', async () => {
      const result = await getWordDefinition('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only word', async () => {
      const result = await getWordDefinition('   ');
      expect(result).toBeNull();
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
        example: 'Hello, world!'
      });
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

    it('should handle API errors with status 429', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' })
      });

      await expect(getWordDefinition('test')).rejects.toThrow(
        'API quota exceeded'
      );
    });

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

      const [url, options] = global.fetch.mock.calls[0];
      
      expect(url).toContain('mistral.ai');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toContain('Bearer');
      
      const body = JSON.parse(options.body);
      expect(body.model).toBe('mistral-tiny');
      expect(body.messages[0].role).toBe('user');
      expect(body.messages[0].content).toContain('hello');
    });
  });
});
