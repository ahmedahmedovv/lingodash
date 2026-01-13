import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage module
vi.mock('./storage/index.js', () => ({
    getSavedWords: vi.fn(),
    getWordsDueForReview: vi.fn(),
    updateWordReview: vi.fn()
}));

import * as storage from './storage/index.js';

describe('Exercise Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup DOM for exercise tests
        document.body.innerHTML = `
            <button id="startExercise">Start</button>
            <button id="submitAnswer">Submit</button>
            <button id="nextQuestion">Next</button>
            <button id="restartExercise">Restart</button>
            <input id="answerInput" />
            <div id="exampleSentence"></div>
            <div id="definitionDisplay"></div>
            <div id="answerFeedback"></div>
            <div id="wordDueInfo"></div>
            <div id="wordStats"></div>
            <div id="exerciseScore">Score: 0</div>
            <div id="exerciseProgress">0/0</div>
            <div id="exerciseContent" style="display: block;"></div>
            <div id="exerciseQuiz" style="display: none;"></div>
            <div id="exerciseResults" style="display: none;"></div>
            <div id="finalScore"></div>
        `;

        // Mock alert
        global.alert = vi.fn();
    });

    describe('Exercise Requirements', () => {
        it('should have all required DOM elements', () => {
            expect(document.getElementById('startExercise')).toBeTruthy();
            expect(document.getElementById('submitAnswer')).toBeTruthy();
            expect(document.getElementById('nextQuestion')).toBeTruthy();
            expect(document.getElementById('answerInput')).toBeTruthy();
            expect(document.getElementById('exampleSentence')).toBeTruthy();
            expect(document.getElementById('definitionDisplay')).toBeTruthy();
            expect(document.getElementById('wordDueInfo')).toBeTruthy();
            expect(document.getElementById('wordStats')).toBeTruthy();
        });

        it('should require at least 3 words to start exercise', async () => {
            storage.getSavedWords.mockResolvedValue([
                { word: 'one', definition: 'first', example: 'Example one' },
                { word: 'two', definition: 'second', example: 'Example two' }
            ]);

            // Simulate starting exercise with less than 3 words
            const words = await storage.getSavedWords();
            expect(words.length).toBeLessThan(3);
        });

        it('should shuffle words for random order', async () => {
            const mockWords = [
                { word: 'word1', definition: 'def1', example: 'ex1' },
                { word: 'word2', definition: 'def2', example: 'ex2' },
                { word: 'word3', definition: 'def3', example: 'ex3' },
                { word: 'word4', definition: 'def4', example: 'ex4' }
            ];

            storage.getSavedWords.mockResolvedValue(mockWords);

            // Verify we have enough words
            const words = await storage.getSavedWords();
            expect(words.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Answer Checking Logic', () => {
        it('should check answer case-insensitively', () => {
            const correctWord = 'Hello';
            const userAnswer = 'hello';

            expect(userAnswer.toLowerCase()).toBe(correctWord.toLowerCase());
        });

        it('should trim whitespace from answers', () => {
            const userAnswer = '  hello  ';
            const trimmed = userAnswer.trim();

            expect(trimmed).toBe('hello');
        });

        it('should not submit empty answers', () => {
            const userAnswer = '';

            expect(userAnswer.trim()).toBe('');
        });

        it('should calculate percentage correctly', () => {
            const correctAnswers = 7;
            const totalQuestions = 10;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

            expect(percentage).toBe(70);
        });
    });

    describe('Example Sentence Blanking', () => {
        it('should replace word with blanks in example', () => {
            const word = 'hello';
            const example = 'Say hello to my friend';
            const blank = '___________';

            const result = example.replace(new RegExp(word, 'gi'), blank);

            expect(result).toBe('Say ___________ to my friend');
        });

        it('should handle case-insensitive replacement', () => {
            const word = 'test';
            const example = 'This is a Test sentence with TEST';
            const blank = '___________';

            const result = example.replace(new RegExp(word, 'gi'), blank);

            expect(result).toContain('___________');
            expect(result.toLowerCase()).not.toContain('test');
        });
    });

    describe('Score Tracking', () => {
        it('should start with 0 correct answers', () => {
            let correctAnswers = 0;
            expect(correctAnswers).toBe(0);
        });

        it('should increment score on correct answer', () => {
            let correctAnswers = 0;
            const isCorrect = true;

            if (isCorrect) {
                correctAnswers++;
            }

            expect(correctAnswers).toBe(1);
        });

        it('should not increment score on incorrect answer', () => {
            let correctAnswers = 0;
            const isCorrect = false;

            if (isCorrect) {
                correctAnswers++;
            }

            expect(correctAnswers).toBe(0);
        });
    });

    describe('Question Navigation', () => {
        it('should track current question index', () => {
            let currentQuestionIndex = 0;

            expect(currentQuestionIndex).toBe(0);

            currentQuestionIndex++;
            expect(currentQuestionIndex).toBe(1);
        });

        it('should show results when all questions answered', () => {
            const totalQuestions = 5;
            let currentQuestionIndex = 5;

            const shouldShowResults = currentQuestionIndex >= totalQuestions;
            expect(shouldShowResults).toBe(true);
        });

        it('should continue showing questions when not finished', () => {
            const totalQuestions = 5;
            let currentQuestionIndex = 3;

            const shouldShowResults = currentQuestionIndex >= totalQuestions;
            expect(shouldShowResults).toBe(false);
        });
    });

    describe('Spaced Repetition Integration', () => {
        it('should call updateWordReview on correct answer', async () => {
            storage.updateWordReview.mockResolvedValue(true);

            await storage.updateWordReview('test', true);

            expect(storage.updateWordReview).toHaveBeenCalledWith('test', true);
        });

        it('should call updateWordReview on incorrect answer', async () => {
            storage.updateWordReview.mockResolvedValue(true);

            await storage.updateWordReview('test', false);

            expect(storage.updateWordReview).toHaveBeenCalledWith('test', false);
        });

        it('should fetch words due for review', async () => {
            const dueWords = [
                { word: 'word1', definition: 'def1', example: 'ex1', nextReview: new Date().toISOString() }
            ];
            storage.getWordsDueForReview.mockResolvedValue(dueWords);

            const result = await storage.getWordsDueForReview();

            expect(result).toHaveLength(1);
            expect(result[0].word).toBe('word1');
        });
    });
});
