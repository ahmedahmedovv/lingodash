import { getSavedWords, getWordsDueForReview, updateWordReviewFSRS, deleteWord, updateWord } from './storage.js';
import { showEditModal, displaySavedWords } from './ui.js';

let exerciseWords = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let masteredWords = new Set(); // Track words answered correctly in this session
let totalAttempts = 0; // Track total questions answered
let questionStartTime = null; // Track when the current question was shown

// Exercise data cache for instant loading
let exerciseDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pre-fetch exercise data when app initializes
export async function prefetchExerciseData() {
    try {
        const [savedWords, dueWords] = await Promise.all([
            getSavedWords(),
            getWordsDueForReview()
        ]);

        exerciseDataCache = { savedWords, dueWords };
        cacheTimestamp = Date.now();
    } catch (error) {
        console.error('Failed to pre-fetch exercise data:', error);
    }
}

// Check if cached data is still valid
function isCacheValid() {
    return exerciseDataCache && cacheTimestamp &&
           (Date.now() - cacheTimestamp) < CACHE_DURATION;
}

// Session size preference management
const SESSION_SIZE_KEY = 'lingodash_session_size';
const DEFAULT_SESSION_SIZE = 25;

function getSessionSize() {
    const saved = localStorage.getItem(SESSION_SIZE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SESSION_SIZE;
}

function setSessionSize(size) {
    localStorage.setItem(SESSION_SIZE_KEY, size.toString());
}

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
        
        // Add event listeners for session size changes
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
    document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
    document.getElementById('restartExercise').addEventListener('click', resetExercise);

    // Allow Enter key to submit answer
    document.getElementById('answerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (!e.target.disabled) {
                // Input is enabled - submit answer
                e.stopPropagation(); // Prevent event from bubbling to document listener
                checkAnswer();
            }
        }
    });

    // Global Enter key listener for next question
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const answerInput = document.getElementById('answerInput');
            const exerciseQuiz = document.getElementById('exerciseQuiz');

            // If input is disabled (answer was submitted) and quiz is visible
            if (answerInput.disabled && exerciseQuiz.style.display === 'block') {
                nextQuestion();
            }
        }
    });

    // Edit button handler
    document.getElementById('exerciseEditBtn').addEventListener('click', handleEditWord);

    // Delete button handler
    document.getElementById('exerciseDeleteBtn').addEventListener('click', handleDeleteWord);
}

function updateExerciseProgress() {
    // Score and progress removed from UI
    // Kept for internal tracking
}

async function startExercise() {
    // Show loading state (only if we need to fetch data)
    const exerciseContent = document.getElementById('exerciseContent');

    let savedWords, dueWords;

    // Try to use cached data first
    if (isCacheValid()) {
        savedWords = exerciseDataCache.savedWords;
        dueWords = exerciseDataCache.dueWords;
    } else {
        // Show loading state only when fetching
        exerciseContent.innerHTML = '<p class="loading">Loading words...</p>';

        // Run both database calls in parallel to reduce loading time
        [savedWords, dueWords] = await Promise.all([
            getSavedWords(),
            getWordsDueForReview()
        ]);

        // Update cache
        exerciseDataCache = { savedWords, dueWords };
        cacheTimestamp = Date.now();
    }

    if (savedWords.length < 3) {
        exerciseContent.innerHTML = '<p class="error">You need at least 3 saved words to start the exercise!</p>';
        setTimeout(() => {
            renderExerciseStartScreen();
        }, 3000);
        return;
    }

    // Get session size preference
    const sessionSize = getSessionSize();
    
    // Prioritize words due for review, but limit to session size
    let selectedWords = [];
    
    // First, take due words up to the session size limit
    if (dueWords.length > 0) {
        selectedWords = dueWords.slice(0, sessionSize);
    }
    
    // If we have fewer words than the session size, add random words from saved words
    if (selectedWords.length < sessionSize && savedWords.length > selectedWords.length) {
        // Get words that aren't already selected (avoid duplicates)
        const selectedWordLower = new Set(selectedWords.map(w => w.word.toLowerCase()));
        const availableWords = savedWords.filter(word => 
            !selectedWordLower.has(word.word.toLowerCase())
        );
        
        // Shuffle and take enough to reach session size
        const remaining = sessionSize - selectedWords.length;
        const additionalWords = availableWords
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(remaining, availableWords.length));
        
        selectedWords = [...selectedWords, ...additionalWords];
    }
    
    // If no words were due and we still don't have enough, use random selection
    if (selectedWords.length === 0 && savedWords.length > 0) {
        selectedWords = savedWords
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(sessionSize, savedWords.length));
    }
    
    // Limit to session size (ensure we don't exceed it)
    exerciseWords = selectedWords.slice(0, sessionSize);
    
    // Add slight randomization while keeping priority on due words
    // Split into priority (first half) and other (second half) for better distribution
    const priorityWords = exerciseWords.slice(0, Math.ceil(exerciseWords.length / 2));
    const otherWords = exerciseWords.slice(Math.ceil(exerciseWords.length / 2));
    exerciseWords = [
        ...priorityWords.sort(() => Math.random() - 0.5),
        ...otherWords.sort(() => Math.random() - 0.5)
    ];
    
    currentQuestionIndex = 0;
    correctAnswers = 0;
    masteredWords.clear(); // Reset mastered words
    totalAttempts = 0; // Reset attempts counter
    
    // Reset the exercise content HTML (will be restored on reset)
    document.getElementById('exerciseContent').style.display = 'none';
    document.getElementById('exerciseQuiz').style.display = 'block';
    document.getElementById('exerciseResults').style.display = 'none';

    // Show and initialize progress counter
    updateProgressCounter();
    document.getElementById('exerciseProgress').style.display = 'block';

    updateExerciseProgress();
    showQuestion();
}

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

function showQuestion() {
    // Check if all words have been mastered
    const initialWordCount = [...new Set(exerciseWords.map(w => w.word.toLowerCase()))].length;
    if (masteredWords.size === initialWordCount && currentQuestionIndex >= exerciseWords.length) {
        showResults();
        return;
    }

    // If we reached the end but still have unmastered words, shouldn't happen but safety check
    if (currentQuestionIndex >= exerciseWords.length) {
        showResults();
        return;
    }

    const currentWord = exerciseWords[currentQuestionIndex];

    // Record when the question was shown (for FSRS response time tracking)
    questionStartTime = Date.now();

    // Trigger slide-in animation
    const questionCard = document.querySelector('.question-card-minimal');
    questionCard.classList.remove('slide-in');
    // Force reflow to restart animation
    void questionCard.offsetWidth;
    questionCard.classList.add('slide-in');

    // Display word due date information
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

    // Hide edit/delete buttons until answer is submitted
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

    // Keep word stats hidden (minimalist approach)
    // document.getElementById('wordStats').classList.remove('visible');

    // Update progress counter for current question
    updateProgressCounter();
}

function displayWordDueInfo(word) {
    const dueInfoDiv = document.getElementById('wordDueInfo');
    
    if (!word.nextReview) {
        // New word without review data
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
        // Overdue
        const overdueDays = Math.abs(diffDays);
        badgeClass = 'overdue';
        badgeText = `−${overdueDays}d`;
    } else if (diffDays === 0) {
        // Due today
        badgeClass = 'today';
        badgeText = 'Today';
    } else {
        // Future review
        badgeClass = 'upcoming';
        badgeText = `+${diffDays}d`;
    }
    
    dueInfoDiv.className = 'word-due-info-minimal';
    dueInfoDiv.innerHTML = `<span class="word-badge ${badgeClass}">${badgeText}</span>`;
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function displayWordStats(word) {
    const statsDiv = document.getElementById('wordStats');
    
    const reviewCount = word.reviewCount || 0;
    const correctCount = word.correctCount || 0;
    const accuracy = reviewCount > 0 ? Math.round((correctCount / reviewCount) * 100) : 0;
    const interval = word.interval || 0;
    
    statsDiv.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Reviewed</span>
            <span class="stat-value">${reviewCount}×</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value">${accuracy}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Interval</span>
            <span class="stat-value">${interval}d</span>
        </div>
    `;
    statsDiv.classList.add('visible');
}

async function checkAnswer() {
    const answerInput = document.getElementById('answerInput');
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentWord = exerciseWords[currentQuestionIndex];
    const correctWord = currentWord.word.toLowerCase();

    if (!userAnswer) {
        return; // Don't submit empty answers
    }

    const isCorrect = userAnswer === correctWord;
    const feedbackDiv = document.getElementById('answerFeedback');

    // Increment total attempts
    totalAttempts++;

    // Disable input and update hint text for continue
    answerInput.disabled = true;
    const hintText = document.querySelector('.press-enter-hint');
    if (hintText) {
        hintText.textContent = 'Press Enter to continue →';
        hintText.classList.add('continue-hint');
    }

    // Show edit/delete buttons after answer is submitted
    document.getElementById('exerciseCardActions').style.display = 'flex';

    // Calculate response time for FSRS rating determination
    const responseTime = questionStartTime ? Date.now() - questionStartTime : 3000; // Default 3 seconds if not tracked

    // Update spaced repetition data with FSRS (non-blocking - runs in background)
    updateWordReviewFSRS(currentWord.word, isCorrect, responseTime);
    
    // Don't show word statistics - keeping UI minimal
    // displayWordStats(currentWord);
    
    if (isCorrect) {
        // Mark word as mastered in this session
        masteredWords.add(correctWord);

        // Show the word in the example sentence with highlighting
        const exampleWithWord = currentWord.example
            ? currentWord.example.replace(
                new RegExp(currentWord.word, 'gi'),
                `<mark class="highlight-word">${currentWord.word}</mark>`
            )
            : `Example with "<mark class="highlight-word">${currentWord.word}</mark>"`;

        document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithWord}"</em>`;

        // No feedback message - user can see the highlighted word
        feedbackDiv.innerHTML = '';
        answerInput.classList.add('correct-input');

        // Add sparkle effect
        createSparkles();

        correctAnswers++;
        updateExerciseProgress();
    } else {
        // Word answered incorrectly - add it back to the queue
        // Insert it 2-8 positions ahead (or at the end if near the end)
        const insertPosition = Math.min(
            currentQuestionIndex + Math.floor(Math.random() * 7) + 2,
            exerciseWords.length
        );

        // Create a copy of the word to re-add
        exerciseWords.splice(insertPosition, 0, { ...currentWord });

        // Show the correct word in the example sentence for incorrect answers
        const exampleWithWord = currentWord.example
            ? currentWord.example.replace(
                new RegExp(currentWord.word, 'gi'),
                `<mark class="highlight-word">${currentWord.word}</mark>`
            )
            : `Example with "<mark class="highlight-word">${currentWord.word}</mark>"`;

        document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithWord}"</em>`;

        // Keep UI minimal - no retry notice needed
        feedbackDiv.innerHTML = '';
        answerInput.classList.add('incorrect-input');

        // Add shake animation
        answerInput.classList.add('shake');
    }
    
    currentQuestionIndex++;
    updateExerciseProgress();

    // Keep next button hidden - user must press Enter to continue
}

function nextQuestion() {
    // Reset input styling
    const answerInput = document.getElementById('answerInput');
    answerInput.classList.remove('correct-input', 'incorrect-input');
    showQuestion();
}

function showResults() {
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

function getCurrentWord() {
    // Get the word that was just answered (currentQuestionIndex was incremented after checkAnswer)
    return exerciseWords[currentQuestionIndex - 1];
}

async function handleDeleteWord() {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    const confirmed = confirm(`Delete "${currentWord.word}" from your vocabulary?`);
    if (!confirmed) return;

    const success = await deleteWord(currentWord.word);
    if (success) {
        // Remove all instances of this word from the exercise queue
        exerciseWords = exerciseWords.filter(w =>
            w.word.toLowerCase() !== currentWord.word.toLowerCase()
        );

        // Remove from mastered set if present
        masteredWords.delete(currentWord.word.toLowerCase());

        // Adjust currentQuestionIndex since we removed the word
        currentQuestionIndex--;

        // Update saved words display
        await displaySavedWords();

        // Check if we still have words to continue
        if (exerciseWords.length < 1) {
            alert('No more words in exercise. Returning to start.');
            resetExercise();
        } else {
            // Move to next question
            nextQuestion();
        }
    } else {
        alert('Failed to delete word. Please try again.');
    }
}

function handleEditWord() {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    // Show the edit modal (imported from ui.js)
    showEditModal(currentWord.word, currentWord.definition, currentWord.example || '');

    // After modal closes and word is updated, we need to refresh the display
    // The modal will handle updating the database
    // We'll listen for when the modal is removed to refresh the current question display
    const checkModalClosed = setInterval(() => {
        const modal = document.querySelector('.edit-overlay');
        if (!modal) {
            clearInterval(checkModalClosed);
            // Refresh the current word data from storage
            refreshCurrentWord();
        }
    }, 100);
}

async function refreshCurrentWord() {
    const currentWord = getCurrentWord();
    if (!currentWord) return;

    // Fetch updated words from storage
    const savedWords = await getSavedWords();
    const updatedWord = savedWords.find(w =>
        w.word.toLowerCase() === currentWord.word.toLowerCase() ||
        w.id === currentWord.id
    );

    if (updatedWord) {
        // Update the word in exerciseWords array
        const index = currentQuestionIndex - 1;
        if (index >= 0 && index < exerciseWords.length) {
            exerciseWords[index] = updatedWord;

            // Update the display with new data
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

    // Update saved words display
    await displaySavedWords();
}

function createSparkles() {
    const exampleSentence = document.querySelector('.example-sentence');
    if (!exampleSentence) return;

    // Remove any existing sparkle container
    const existingSparkles = document.querySelector('.sparkle-container');
    if (existingSparkles) {
        existingSparkles.remove();
    }

    // Create sparkle container
    const sparkleContainer = document.createElement('div');
    sparkleContainer.className = 'sparkle-container';

    // Create 8 sparkles
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkleContainer.appendChild(sparkle);
    }

    exampleSentence.appendChild(sparkleContainer);

    // Remove sparkles after animation completes
    setTimeout(() => {
        sparkleContainer.remove();
    }, 1000);
}



// Update progress counter display
function updateProgressCounter() {
    const currentQuestionNum = document.getElementById('currentQuestionNum');
    const totalQuestions = document.getElementById('totalQuestions');
    const remainingQuestions = document.getElementById('remainingQuestions');

    if (currentQuestionNum && totalQuestions && remainingQuestions) {
        const current = Math.min(currentQuestionIndex + 1, exerciseWords.length);
        const total = exerciseWords.length;
        const remaining = Math.max(0, total - current);

        currentQuestionNum.textContent = current;
        totalQuestions.textContent = total;
        remainingQuestions.textContent = remaining;
    }
}

function resetExercise() {
    document.getElementById('exerciseContent').style.display = 'block';
    document.getElementById('exerciseQuiz').style.display = 'none';
    document.getElementById('exerciseResults').style.display = 'none';

    // Hide progress counter
    document.getElementById('exerciseProgress').style.display = 'none';

    correctAnswers = 0;
    currentQuestionIndex = 0;
    masteredWords.clear();
    totalAttempts = 0;
    updateExerciseProgress();
    renderExerciseStartScreen();
}
