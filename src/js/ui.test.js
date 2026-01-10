import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage module before importing ui
vi.mock('./storage.js', () => ({
    getSavedWords: vi.fn(),
    deleteWord: vi.fn(),
    updateWord: vi.fn(),
    exportWords: vi.fn()
}));

import { displaySavedWords, initTabs } from './ui.js';
import * as storage from './storage.js';

describe('UI Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset DOM before each test
        document.body.innerHTML = `
            <div id="savedWordsList"></div>
            <div class="tab-header">
                <button class="tab-btn" data-tab="lookup">Lookup</button>
                <button class="tab-btn" data-tab="saved">Saved</button>
                <button class="tab-btn" data-tab="exercise">Exercise</button>
            </div>
            <div class="tab-panel" id="lookup-panel">Lookup Panel</div>
            <div class="tab-panel" id="saved-panel">Saved Panel</div>
            <div class="tab-panel" id="exercise-panel">Exercise Panel</div>
        `;
    });

    describe('displaySavedWords', () => {
        it('should display empty state when no words are saved', async () => {
            storage.getSavedWords.mockResolvedValue([]);

            await displaySavedWords();

            const list = document.getElementById('savedWordsList');
            expect(list.innerHTML).toContain('No saved words yet');
        });

        it('should display saved words', async () => {
            const mockWords = [
                {
                    word: 'hello',
                    definition: 'a greeting',
                    example: 'Hello there!',
                    timestamp: new Date('2024-01-01').toISOString()
                },
                {
                    word: 'world',
                    definition: 'the earth',
                    example: 'The world is round.',
                    timestamp: new Date('2024-01-02').toISOString()
                }
            ];

            storage.getSavedWords.mockResolvedValue(mockWords);

            await displaySavedWords();

            const list = document.getElementById('savedWordsList');
            expect(list.innerHTML).toContain('hello');
            expect(list.innerHTML).toContain('world');
            expect(list.innerHTML).toContain('a greeting');
            expect(list.innerHTML).toContain('the earth');
        });

        it('should add delete buttons for each word', async () => {
            const mockWords = [
                {
                    word: 'test',
                    definition: 'a test',
                    example: 'This is a test.',
                    timestamp: new Date().toISOString()
                }
            ];

            storage.getSavedWords.mockResolvedValue(mockWords);

            await displaySavedWords();

            const deleteBtn = document.querySelector('.delete-btn');
            expect(deleteBtn).toBeTruthy();
            expect(deleteBtn.getAttribute('data-word')).toBe('test');
        });

        it('should add edit buttons for each word', async () => {
            const mockWords = [
                {
                    word: 'test',
                    definition: 'a test',
                    example: 'This is a test.',
                    timestamp: new Date().toISOString()
                }
            ];

            storage.getSavedWords.mockResolvedValue(mockWords);

            await displaySavedWords();

            const editBtn = document.querySelector('.edit-btn');
            expect(editBtn).toBeTruthy();
            expect(editBtn.getAttribute('data-word')).toBe('test');
        });

        it('should call deleteWord when delete button is clicked', async () => {
            const mockWords = [
                {
                    word: 'test',
                    definition: 'a test',
                    example: 'This is a test.',
                    timestamp: new Date().toISOString()
                }
            ];

            storage.getSavedWords.mockResolvedValue(mockWords);
            storage.deleteWord.mockResolvedValue(true);

            await displaySavedWords();

            const deleteBtn = document.querySelector('.delete-btn');
            deleteBtn.click();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(storage.deleteWord).toHaveBeenCalledWith('test');
        });

        it('should display example sentences', async () => {
            const mockWords = [
                {
                    word: 'test',
                    definition: 'a test',
                    example: 'This is a test example.',
                    timestamp: new Date().toISOString()
                }
            ];

            storage.getSavedWords.mockResolvedValue(mockWords);

            await displaySavedWords();

            const list = document.getElementById('savedWordsList');
            expect(list.innerHTML).toContain('This is a test example.');
        });
    });

    describe('initTabs', () => {
        it('should add click listeners to tab buttons', () => {
            initTabs();

            const buttons = document.querySelectorAll('.tab-btn');
            expect(buttons).toHaveLength(3);
        });

        it('should switch active tab when button is clicked', () => {
            initTabs();

            const savedBtn = document.querySelector('[data-tab="saved"]');
            savedBtn.click();

            expect(savedBtn.classList.contains('active')).toBe(true);
            expect(document.getElementById('saved-panel').classList.contains('active')).toBe(true);
        });

        it('should remove active class from previous tab', () => {
            initTabs();

            const lookupBtn = document.querySelector('[data-tab="lookup"]');
            const savedBtn = document.querySelector('[data-tab="saved"]');

            // Mark lookup as active initially
            lookupBtn.classList.add('active');
            document.getElementById('lookup-panel').classList.add('active');

            // Click saved tab
            savedBtn.click();

            expect(lookupBtn.classList.contains('active')).toBe(false);
            expect(document.getElementById('lookup-panel').classList.contains('active')).toBe(false);
        });

        it('should switch between all tabs', () => {
            initTabs();

            const tabs = ['lookup', 'saved', 'exercise'];

            tabs.forEach(tab => {
                const btn = document.querySelector(`[data-tab="${tab}"]`);
                btn.click();

                expect(btn.classList.contains('active')).toBe(true);
                expect(document.getElementById(`${tab}-panel`).classList.contains('active')).toBe(true);
            });
        });
    });
});
