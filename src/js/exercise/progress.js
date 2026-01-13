/**
 * Exercise Progress Module
 * Handles progress tracking and display
 */

import { getExerciseWords, getQuizState } from './quiz.js';

/**
 * Update exercise progress (internal tracking)
 */
export function updateExerciseProgress() {
    // Score and progress removed from UI
    // Kept for internal tracking
}

/**
 * Update the progress counter display
 */
export function updateProgressCounter() {
    const currentQuestionNum = document.getElementById('currentQuestionNum');
    const totalQuestions = document.getElementById('totalQuestions');
    const remainingQuestions = document.getElementById('remainingQuestions');

    const exerciseWords = getExerciseWords();
    const { currentQuestionIndex } = getQuizState();

    if (currentQuestionNum && totalQuestions && remainingQuestions) {
        const current = Math.min(currentQuestionIndex + 1, exerciseWords.length);
        const total = exerciseWords.length;
        const remaining = Math.max(0, total - current);

        currentQuestionNum.textContent = current;
        totalQuestions.textContent = total;
        remainingQuestions.textContent = remaining;
    }
}

/**
 * Show the progress counter
 */
export function showProgressCounter() {
    const progressElement = document.getElementById('exerciseProgress');
    if (progressElement) {
        progressElement.style.display = 'block';
    }
}

/**
 * Hide the progress counter
 */
export function hideProgressCounter() {
    const progressElement = document.getElementById('exerciseProgress');
    if (progressElement) {
        progressElement.style.display = 'none';
    }
}

/**
 * Get session statistics
 * @returns {Object} Session statistics
 */
export function getSessionStats() {
    const exerciseWords = getExerciseWords();
    const { correctAnswers, masteredWords, totalAttempts } = getQuizState();

    return {
        totalWords: exerciseWords.length,
        masteredCount: masteredWords.size,
        correctAnswers,
        totalAttempts,
        accuracy: totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0
    };
}
