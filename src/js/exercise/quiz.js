/**
 * Exercise Quiz Module
 * Handles quiz flow, answer checking, and word display
 */

import { updateWordReviewFSRS, deleteWord } from '../storage/index.js';
import { showEditModal, displaySavedWords } from '../ui/index.js';
import { getSavedWords } from '../storage/index.js';

// Quiz state
let exerciseWords = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let masteredWords = new Set();
let totalAttempts = 0;
let questionStartTime = null;

/**
 * Get current exercise words array
 * @returns {Array} Exercise words
 */
export function getExerciseWords() {
    return exerciseWords;
}

/**
 * Set exercise words
 * @param {Array} words - Words for the exercise
 */
export function setExerciseWords(words) {
    exerciseWords = words;
}

/**
 * Get quiz state
 * @returns {Object} Current quiz state
 */
export function getQuizState() {
    return {
        currentQuestionIndex,
        correctAnswers,
        masteredWords: new Set(masteredWords),
        totalAttempts
    };
}

/**
 * Reset quiz state
 */
export function resetQuizState() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    masteredWords.clear();
    totalAttempts = 0;
    exerciseWords = [];
}

/**
 * Initialize quiz with words
 * @param {Array} words - Words for the session
 */
export function initializeQuiz(words) {
    exerciseWords = words;
    currentQuestionIndex = 0;
    correctAnswers = 0;
    masteredWords.clear();
    totalAttempts = 0;
}

/**
 * Show the current question
 * @param {Function} updateProgressCallback - Callback to update progress display
 */
export function showQuestion(updateProgressCallback) {
    const initialWordCount = [...new Set(exerciseWords.map(w => w.word.toLowerCase()))].length;
    if (masteredWords.size === initialWordCount && currentQuestionIndex >= exerciseWords.length) {
        showResults();
        return;
    }

    if (currentQuestionIndex >= exerciseWords.length) {
        showResults();
        return;
    }

    const currentWord = exerciseWords[currentQuestionIndex];
    questionStartTime = Date.now();

    // Trigger slide-in animation
    const questionCard = document.querySelector('.question-card-minimal');
    if (questionCard) {
        questionCard.classList.remove('slide-in');
        void questionCard.offsetWidth;
        questionCard.classList.add('slide-in');
    }

    displayWordDueInfo(currentWord);

    // Show the example sentence with blanks for the word
    const exampleWithBlank = currentWord.example
        ? currentWord.example.replace(new RegExp(currentWord.word, 'gi'), '___________')
        : 'Example sentence not available.';

    document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithBlank}"</em>`;

    // Show the definition with first letter hint
    const firstLetter = currentWord.word.charAt(0).toUpperCase();
    document.getElementById('definitionDisplay').textContent = `${currentWord.definition} (${firstLetter})`;

    // Reset input and feedback
    const answerInput = document.getElementById('answerInput');
    answerInput.value = '';
    answerInput.disabled = false;
    answerInput.classList.remove('correct-input', 'incorrect-input', 'shake');
    answerInput.focus();

    document.getElementById('answerFeedback').innerHTML = '';
    document.getElementById('nextQuestion').style.display = 'none';
    document.getElementById('exerciseCardActions').style.display = 'none';

    // Remove any existing sparkle container
    const existingSparkles = document.querySelector('.sparkle-container');
    if (existingSparkles) {
        existingSparkles.remove();
    }

    // Update hint text for input mode
    const hintText = document.querySelector('.press-enter-hint');
    if (hintText) {
        hintText.style.display = 'block';
        hintText.textContent = 'Press Enter to submit';
        hintText.classList.remove('continue-hint');
    }

    if (updateProgressCallback) {
        updateProgressCallback();
    }
}

/**
 * Display word due date information
 * @param {Object} word - Word object
 */
function displayWordDueInfo(word) {
    const dueInfoDiv = document.getElementById('wordDueInfo');

    if (!word.nextReview) {
        dueInfoDiv.innerHTML = '<span class="word-badge new">New</span>';
        dueInfoDiv.className = 'word-due-info-minimal';
        return;
    }

    const now = new Date();
    const dueDate = new Date(word.nextReview);
    const diffMs = dueDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let badgeClass = '';
    let badgeText = '';

    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        badgeClass = 'overdue';
        badgeText = `−${overdueDays}d`;
    } else if (diffDays === 0) {
        badgeClass = 'today';
        badgeText = 'Today';
    } else {
        badgeClass = 'upcoming';
        badgeText = `+${diffDays}d`;
    }

    dueInfoDiv.className = 'word-due-info-minimal';
    dueInfoDiv.innerHTML = `<span class="word-badge ${badgeClass}">${badgeText}</span>`;
}

/**
 * Check the user's answer
 */
export async function checkAnswer() {
    const answerInput = document.getElementById('answerInput');
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentWord = exerciseWords[currentQuestionIndex];
    const correctWord = currentWord.word.toLowerCase();

    if (!userAnswer) {
        return;
    }

    const isCorrect = userAnswer === correctWord;
    const feedbackDiv = document.getElementById('answerFeedback');

    totalAttempts++;

    answerInput.disabled = true;
    const hintText = document.querySelector('.press-enter-hint');
    if (hintText) {
        hintText.textContent = 'Press Enter to continue →';
        hintText.classList.add('continue-hint');
    }

    document.getElementById('exerciseCardActions').style.display = 'flex';

    const responseTime = questionStartTime ? Date.now() - questionStartTime : 3000;

    // Update spaced repetition data with FSRS (non-blocking)
    updateWordReviewFSRS(currentWord.word, isCorrect, responseTime);

    if (isCorrect) {
        masteredWords.add(correctWord);

        const exampleWithWord = currentWord.example
            ? currentWord.example.replace(
                new RegExp(currentWord.word, 'gi'),
                `<mark class="highlight-word">${currentWord.word}</mark>`
            )
            : `Example with "<mark class="highlight-word">${currentWord.word}</mark>"`;

        document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithWord}"</em>`;

        feedbackDiv.innerHTML = '';
        answerInput.classList.add('correct-input');

        createSparkles();
        correctAnswers++;
    } else {
        // Word answered incorrectly - add it back to the queue
        const insertPosition = Math.min(
            currentQuestionIndex + Math.floor(Math.random() * 7) + 2,
            exerciseWords.length
        );

        exerciseWords.splice(insertPosition, 0, { ...currentWord });

        const exampleWithWord = currentWord.example
            ? currentWord.example.replace(
                new RegExp(currentWord.word, 'gi'),
                `<mark class="highlight-word">${currentWord.word}</mark>`
            )
            : `Example with "<mark class="highlight-word">${currentWord.word}</mark>"`;

        document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithWord}"</em>`;

        feedbackDiv.innerHTML = '';
        answerInput.classList.add('incorrect-input');
        answerInput.classList.add('shake');
    }

    currentQuestionIndex++;
}

/**
 * Move to the next question
 * @param {Function} updateProgressCallback - Callback to update progress
 */
export function nextQuestion(updateProgressCallback) {
    const answerInput = document.getElementById('answerInput');
    answerInput.classList.remove('correct-input', 'incorrect-input');
    showQuestion(updateProgressCallback);
}

/**
 * Show exercise results
 */
export function showResults() {
    document.getElementById('exerciseQuiz').style.display = 'none';
    document.getElementById('exerciseResults').style.display = 'block';

    const uniqueWords = masteredWords.size;
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    document.getElementById('finalScore').innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>${uniqueWords}</strong> word${uniqueWords !== 1 ? 's' : ''} mastered
        </div>
        <div style="font-size: 1rem; color: #666;">
            ${correctAnswers} correct out of ${totalAttempts} attempts (${accuracy}%)
        </div>
    `;
}

/**
 * Create sparkle animation effect
 */
function createSparkles() {
    const exampleSentence = document.querySelector('.example-sentence');
    if (!exampleSentence) return;

    const existingSparkles = document.querySelector('.sparkle-container');
    if (existingSparkles) {
        existingSparkles.remove();
    }

    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'sparkle-container';

    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkleContainer.appendChild(sparkle);
    }

    exampleSentence.appendChild(sparkleContainer);

    setTimeout(() => {
        sparkleContainer.remove();
    }, 1000);
}

/**
 * Get the current word (the one just answered)
 * @returns {Object|null} Current word object
 */
export function getCurrentWord() {
    return exerciseWords[currentQuestionIndex - 1] || null;
}

/**
 * Handle word deletion during exercise
 * @param {Function} resetCallback - Callback to reset exercise
 * @param {Function} nextCallback - Callback to move to next question
 */
export async function handleDeleteWord(resetCallback, nextCallback) {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const confirmed = confirm(`Delete "${currentWord.word}" from your vocabulary?`);
    if (!confirmed) return;

    const success = await deleteWord(currentWord.word);
    if (success) {
        exerciseWords = exerciseWords.filter(w =>
            w.word.toLowerCase() !== currentWord.word.toLowerCase()
        );

        masteredWords.delete(currentWord.word.toLowerCase());
        currentQuestionIndex--;

        await displaySavedWords();

        if (exerciseWords.length < 1) {
            alert('No more words in exercise. Returning to start.');
            resetCallback();
        } else {
            nextCallback();
        }
    } else {
        alert('Failed to delete word. Please try again.');
    }
}

/**
 * Handle word editing during exercise
 * @param {Function} refreshCallback - Callback to refresh current word
 */
export function handleEditWord(refreshCallback) {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    showEditModal(currentWord.word, currentWord.definition, currentWord.example || '');

    const checkModalClosed = setInterval(() => {
        const modal = document.querySelector('.edit-overlay');
        if (!modal) {
            clearInterval(checkModalClosed);
            refreshCallback();
        }
    }, 100);
}

/**
 * Refresh the current word data from storage
 */
export async function refreshCurrentWord() {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const savedWords = await getSavedWords();
    const updatedWord = savedWords.find(w =>
        w.word.toLowerCase() === currentWord.word.toLowerCase() ||
        w.id === currentWord.id
    );

    if (updatedWord) {
        const index = currentQuestionIndex - 1;
        if (index >= 0 && index < exerciseWords.length) {
            exerciseWords[index] = updatedWord;

            const exampleWithWord = updatedWord.example
                ? updatedWord.example.replace(
                    new RegExp(updatedWord.word, 'gi'),
                    `<mark class="highlight-word">${updatedWord.word}</mark>`
                )
                : `Example with "<mark class="highlight-word">${updatedWord.word}</mark>"`;

            document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithWord}"</em>`;
            document.getElementById('definitionDisplay').textContent = `${updatedWord.definition} (${updatedWord.word.charAt(0).toUpperCase()})`;
        }
    }

    await displaySavedWords();
}
