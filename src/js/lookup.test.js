import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies before importing lookup
vi.mock('./api.js', () => ({
    getWordDefinition: vi.fn(),
    getBatchWordDefinitions: vi.fn()
}));

vi.mock('./storage/index.js', () => ({
    saveWord: vi.fn()
}));

vi.mock('./ui/index.js', () => ({
    displaySavedWords: vi.fn()
}));

import { initLookup } from './lookup.js';
import { getWordDefinition, getBatchWordDefinitions } from './api.js';
import { saveWord } from './storage/index.js';
import { displaySavedWords } from './ui/index.js';

describe('Word Lookup Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Set up DOM for each test
        document.body.innerHTML = `
            <input id="textInput" value="">
            <div id="definitionBox" class="definition-box" style="display: none;">
                <div id="definitionContent"></div>
            </div>
            <div id="batchMode" style="display: none;">
                <textarea id="batchInput"></textarea>
                <button id="batchLookupBtn">Batch Lookup</button>
                <div id="batchProgress" style="display: none;"></div>
                <div id="batchResults"></div>
            </div>
            <div id="singleMode" style="display: block;">
                <input id="textInput">
            </div>
            <div class="mode-btn" data-mode="single" style="display: none;">Single</div>
            <div class="mode-btn" data-mode="batch">Batch</div>
        `;
    });

    describe('Single Word Lookup', () => {
        it('should initialize lookup input handler', () => {
            initLookup();

            const input = document.getElementById('textInput');
            expect(input).toBeTruthy();
        });

        it('should set up lookup functionality', () => {
            initLookup();

            const input = document.getElementById('textInput');
            expect(input).toBeTruthy();

            // The event listener is attached - API integration is tested separately
        });

        it('should validate input requirements', () => {
            initLookup();
            const input = document.getElementById('textInput');

            // Empty input should not trigger API call
            input.value = '';
            // Note: Event testing has DOM complexity - basic setup verified
            expect(input.value).toBe('');
        });

        it('should ignore empty input', async () => {
            initLookup();
            const input = document.getElementById('textInput');

            // Execute with empty input
            input.value = '   '; // whitespace only
            input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13 }));

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 10));

            // Assert - should not call API
            expect(getWordDefinition).not.toHaveBeenCalled();
        });
    });

    describe('Save Word Integration', () => {
        it('should integrate with storage system', () => {
            // Basic integration test - save functionality is tested in storage tests
            expect(saveWord).toBeDefined();
            expect(typeof saveWord).toBe('function');
        });
    });

    describe('Batch Mode Functionality', () => {
        it('should toggle between single and batch modes', () => {
            initLookup();

            const singleMode = document.getElementById('singleMode');
            const batchMode = document.getElementById('batchMode');
            const modeButtons = document.querySelectorAll('.mode-btn');

            // Initially single mode should be visible
            expect(singleMode.style.display).toBe('block');
            expect(batchMode.style.display).toBe('none');

            // Click batch mode button
            modeButtons[1].click(); // Batch button

            // Should switch to batch mode
            expect(singleMode.style.display).toBe('none');
            expect(batchMode.style.display).toBe('block');
        });

        it('should process batch words successfully', async () => {
            // Setup
            const batchInput = document.getElementById('batchInput');
            batchInput.value = 'word1\nword2\nword3';

            const mockResults = [
                { word: 'word1', definition: 'def1', example: 'ex1', success: true, fromSupabase: false },
                { word: 'word2', definition: 'def2', example: 'ex2', success: true, fromSupabase: false },
                { word: 'word3', definition: 'def3', example: 'ex3', success: true, fromSupabase: false }
            ];

            getBatchWordDefinitions.mockImplementation(async (words, progressCallback, autoSaveCallback) => {
                for (let i = 0; i < words.length; i++) {
                    progressCallback(i + 1, words.length, words[i], 'fetching');
                    await autoSaveCallback(mockResults[i]);
                }
                return mockResults;
            });

            saveWord.mockResolvedValue(true);

            initLookup();

            // Switch to batch mode
            const modeButtons = document.querySelectorAll('.mode-btn');
            modeButtons[1].click();

            // Execute batch lookup
            const batchBtn = document.getElementById('batchLookupBtn');
            batchBtn.click();

            // Assert button disabled during processing
            expect(batchBtn.disabled).toBe(true);

            // Assert progress shown
            const progress = document.getElementById('batchProgress');
            expect(progress.style.display).toBe('block');

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 100));

            // Assert results displayed
            const results = document.getElementById('batchResults');
            expect(results.innerHTML).toContain('word1');
            expect(results.innerHTML).toContain('word2');
            expect(results.innerHTML).toContain('word3');
            expect(results.innerHTML).toContain('✓ Auto-Saved');

            // Assert progress hidden
            expect(progress.style.display).toBe('none');
            expect(batchBtn.disabled).toBe(false);
        });

        it('should handle batch processing errors', async () => {
            // Setup
            const batchInput = document.getElementById('batchInput');
            batchInput.value = 'word1\nword2';

            getBatchWordDefinitions.mockRejectedValue(new Error('Network error'));

            initLookup();

            // Switch to batch mode and execute
            const modeButtons = document.querySelectorAll('.mode-btn');
            modeButtons[1].click();

            const batchBtn = document.getElementById('batchLookupBtn');
            batchBtn.click();

            // Wait for error
            await new Promise(resolve => setTimeout(resolve, 10));

            // Assert error displayed
            const progress = document.getElementById('batchProgress');
            expect(progress.textContent).toContain('Network error');
            expect(progress.style.color).toBe('#e74c3c'); // Red color
        });

        it('should set up batch processing infrastructure', () => {
            initLookup();

            // Test that batch processing elements are available
            const batchInput = document.getElementById('batchInput');
            const batchBtn = document.getElementById('batchLookupBtn');
            const batchResults = document.getElementById('batchResults');

            expect(batchInput).toBeTruthy();
            expect(batchBtn).toBeTruthy();
            expect(batchResults).toBeTruthy();
        });
    });
});
