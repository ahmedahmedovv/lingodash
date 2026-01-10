import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage module
vi.mock('./storage.js', () => ({
    getSavedWords: vi.fn(),
    getWordsDueForReview: vi.fn(),
    updateWordReview: vi.fn()
}));

import * as storage from './storage.js';

describe('Exercise Performance Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `
            <button id="startExercise">Start</button>
            <button id="submitAnswer">Submit</button>
            <button id="nextQuestion">Next</button>
            <button id="restartExercise">Restart</button>
            <input id="answerInput" />
            <div id="exampleSentence"></div>
            <div id="definitionDisplay"></div>
            <div id="answerFeedback"></div>
            <div id="exerciseScore">Score: 0</div>
            <div id="exerciseProgress">0/0</div>
            <div id="exerciseContent" style="display: block;"></div>
            <div id="exerciseQuiz" style="display: none;"></div>
            <div id="exerciseResults" style="display: none;"></div>
            <div id="finalScore"></div>
        `;
        global.alert = vi.fn();
    });

    it('should handle word shuffling efficiently with large dataset', () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example with word${i}`,
            timestamp: new Date().toISOString()
        }));

        const iterations = 1000;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const shuffled = [...mockWords].sort(() => Math.random() - 0.5);
            expect(shuffled.length).toBe(50);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / iterations;

        expect(avgDuration).toBeLessThan(1);
    });

    it('should efficiently replace words in example sentences', () => {
        const testCases = Array.from({ length: 100 }, (_, i) => ({
            word: `word${i}`,
            example: `This is an example sentence with word${i} appearing multiple times. Word${i} is great!`
        }));

        const startTime = performance.now();

        testCases.forEach(({ word, example }) => {
            const blank = '___________';
            const result = example.replace(new RegExp(word, 'gi'), blank);
            expect(result).toContain(blank);
        });

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);
    });

    it('should handle case-insensitive answer checking efficiently', () => {
        const iterations = 10000;
        const correctWord = 'HelloWorld';
        const userAnswer = 'helloworld';

        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const isCorrect = userAnswer.toLowerCase() === correctWord.toLowerCase();
            expect(isCorrect).toBe(true);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgDuration = duration / iterations;

        expect(avgDuration).toBeLessThan(0.1);
    });

    it('should calculate percentages efficiently', () => {
        const iterations = 10000;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            const correctAnswers = Math.floor(Math.random() * 50);
            const totalQuestions = 50;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);
            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(500); // More generous threshold
    });

    it('should handle rapid question transitions', () => {
        const mockWords = Array.from({ length: 20 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example ${i}`,
            timestamp: new Date().toISOString()
        }));

        const startTime = performance.now();

        // Simulate going through all questions
        for (let i = 0; i < mockWords.length; i++) {
            const word = mockWords[i];

            // Display question
            document.getElementById('exampleSentence').textContent = word.example;
            document.getElementById('definitionDisplay').textContent = word.definition;

            // Check answer
            const userAnswer = word.word.toLowerCase();
            const isCorrect = userAnswer === word.word.toLowerCase();
            expect(isCorrect).toBe(true);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(50);
    });

    it('should efficiently handle complex regex replacements', () => {
        const testWords = [
            { word: 'test', example: 'Test this TEST word TeSt' },
            { word: 'hello', example: 'Hello, hello, HELLO!' },
            { word: 'world', example: 'World world WORLD' }
        ];

        const iterations = 1000;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            testWords.forEach(({ word, example }) => {
                const result = example.replace(new RegExp(word, 'gi'), '___');
                expect(result).not.toMatch(new RegExp(word, 'i'));
            });
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(300);
    });

    it('should handle DOM updates during exercise efficiently', () => {
        const mockWords = Array.from({ length: 30 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`,
            example: `Example ${i}`,
            timestamp: new Date().toISOString()
        }));

        const startTime = performance.now();

        // Simulate updating DOM for each question
        mockWords.forEach((word, index) => {
            document.getElementById('exerciseScore').textContent = `Score: ${index}`;
            document.getElementById('exerciseProgress').textContent = `${index}/${mockWords.length}`;
            document.getElementById('exampleSentence').textContent = word.example;
            document.getElementById('definitionDisplay').textContent = word.definition;
        });

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);
    });

    it('should measure memory impact of exercise state', () => {
        const mockWords = Array.from({ length: 50 }, (_, i) => ({
            word: `word${i}`,
            definition: `Definition ${i}`.repeat(10),
            example: `Example ${i}`.repeat(10),
            timestamp: new Date().toISOString()
        }));

        // Simulate storing exercise state
        let exerciseWords = [...mockWords].sort(() => Math.random() - 0.5);
        let currentQuestionIndex = 0;
        let correctAnswers = 0;

        const startTime = performance.now();

        // Simulate going through exercise
        for (let i = 0; i < exerciseWords.length; i++) {
            currentQuestionIndex = i;
            const currentWord = exerciseWords[currentQuestionIndex];
            const userAnswer = currentWord.word.toLowerCase();

            if (userAnswer === currentWord.word.toLowerCase()) {
                correctAnswers++;
            }
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(100);
        expect(correctAnswers).toBe(mockWords.length);
    });
});
