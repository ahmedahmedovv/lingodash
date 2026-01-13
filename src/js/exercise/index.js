/**
 * Exercise Module - Main Entry Point
 * Orchestrates exercise functionality and event listeners
 */

import { getSavedWords, getWordsDueForReview } from '../storage/index.js';
import {
    prefetchExerciseData,
    isCacheValid,
    getCachedData,
    updateCache,
    getSessionSize,
    setSessionSize,
    selectSessionWords
} from './session.js';
import {
    initializeQuiz,
    showQuestion,
    checkAnswer,
    nextQuestion as quizNextQuestion,
    resetQuizState,
    handleDeleteWord,
    handleEditWord,
    refreshCurrentWord,
    getExerciseWords,
    setExerciseWords
} from './quiz.js';
import {
    updateExerciseProgress,
    updateProgressCounter,
    showProgressCounter,
    hideProgressCounter
} from './progress.js';

// Re-export prefetchExerciseData for external use
export { prefetchExerciseData };

/**
 * Initialize the exercise module
 */
export function initExercise() {
    // Load and set saved session size preference
    const savedSize = getSessionSize();
    const sessionSize25 = document.getElementById('sessionSize25');
    const sessionSize50 = document.getElementById('sessionSize50');

    if (sessionSize25 && sessionSize50) {
        if (savedSize === 50) {
            sessionSize50.checked = true;
            sessionSize25.checked = false;
        } else {
            sessionSize25.checked = true;
            sessionSize50.checked = false;
        }

        sessionSize25.addEventListener('change', () => {
            if (sessionSize25.checked) {
                setSessionSize(25);
            }
        });

        sessionSize50.addEventListener('change', () => {
            if (sessionSize50.checked) {
                setSessionSize(50);
            }
        });
    }

    // Button event listeners
    document.getElementById('startExercise').addEventListener('click', startExercise);
    document.getElementById('nextQuestion').addEventListener('click', handleNextQuestion);
    document.getElementById('restartExercise').addEventListener('click', resetExercise);

    // Answer input keypress handler
    document.getElementById('answerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (!e.target.disabled) {
                e.stopPropagation();
                checkAnswer();
                updateExerciseProgress();
                updateProgressCounter();
            }
        }
    });

    // Global Enter key listener for next question
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const answerInput = document.getElementById('answerInput');
            const exerciseQuiz = document.getElementById('exerciseQuiz');

            if (answerInput.disabled && exerciseQuiz.style.display === 'block') {
                handleNextQuestion();
            }
        }
    });

    // Edit button handler
    document.getElementById('exerciseEditBtn').addEventListener('click', () => {
        handleEditWord(refreshCurrentWord);
    });

    // Delete button handler
    document.getElementById('exerciseDeleteBtn').addEventListener('click', () => {
        handleDeleteWord(resetExercise, handleNextQuestion);
    });
}

/**
 * Start the exercise
 */
async function startExercise() {
    const exerciseContent = document.getElementById('exerciseContent');

    let savedWords, dueWords;

    if (isCacheValid()) {
        const cached = getCachedData();
        savedWords = cached.savedWords;
        dueWords = cached.dueWords;
    } else {
        exerciseContent.innerHTML = '<p class="loading">Loading words...</p>';

        [savedWords, dueWords] = await Promise.all([
            getSavedWords(),
            getWordsDueForReview()
        ]);

        updateCache({ savedWords, dueWords });
    }

    if (savedWords.length < 3) {
        exerciseContent.innerHTML = '<p class="error">You need at least 3 saved words to start the exercise!</p>';
        setTimeout(() => {
            renderExerciseStartScreen();
        }, 3000);
        return;
    }

    const sessionSize = getSessionSize();
    const selectedWords = selectSessionWords(savedWords, dueWords, sessionSize);

    initializeQuiz(selectedWords);

    document.getElementById('exerciseContent').style.display = 'none';
    document.getElementById('exerciseQuiz').style.display = 'block';
    document.getElementById('exerciseResults').style.display = 'none';

    updateProgressCounter();
    showProgressCounter();
    updateExerciseProgress();
    showQuestion(updateProgressCounter);
}

/**
 * Handle moving to the next question
 */
function handleNextQuestion() {
    quizNextQuestion(updateProgressCounter);
}

/**
 * Reset the exercise to the start screen
 */
function resetExercise() {
    document.getElementById('exerciseContent').style.display = 'block';
    document.getElementById('exerciseQuiz').style.display = 'none';
    document.getElementById('exerciseResults').style.display = 'none';

    hideProgressCounter();
    resetQuizState();
    updateExerciseProgress();
    renderExerciseStartScreen();
}

/**
 * Render the exercise start screen
 */
function renderExerciseStartScreen() {
    const exerciseContent = document.getElementById('exerciseContent');
    if (!exerciseContent) return;

    const savedSize = getSessionSize();

    exerciseContent.innerHTML = `
        <div class="exercise-start">
            <p class="exercise-title">Vocabulary Practice</p>
            <div class="session-size-selector">
                <div class="session-size-options">
                    <label class="session-size-option">
                        <input type="radio" name="sessionSize" value="25" id="sessionSize25" ${savedSize === 25 ? 'checked' : ''}>
                        <span>25</span>
                    </label>
                    <label class="session-size-option">
                        <input type="radio" name="sessionSize" value="50" id="sessionSize50" ${savedSize === 50 ? 'checked' : ''}>
                        <span>50</span>
                    </label>
                </div>
            </div>
            <button id="startExercise" class="start-btn">Start</button>
        </div>
    `;

    // Re-initialize event listeners for the new elements
    const sessionSize25 = document.getElementById('sessionSize25');
    const sessionSize50 = document.getElementById('sessionSize50');

    if (sessionSize25 && sessionSize50) {
        sessionSize25.addEventListener('change', () => {
            if (sessionSize25.checked) {
                setSessionSize(25);
            }
        });

        sessionSize50.addEventListener('change', () => {
            if (sessionSize50.checked) {
                setSessionSize(50);
            }
        });
    }

    document.getElementById('startExercise').addEventListener('click', startExercise);
}
