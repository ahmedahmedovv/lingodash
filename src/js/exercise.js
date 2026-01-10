import { getSavedWords, getWordsDueForReview, updateWordReview } from './storage.js';

let exerciseWords = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let masteredWords = new Set(); // Track words answered correctly in this session
let totalAttempts = 0; // Track total questions answered

export function initExercise() {
    document.getElementById('startExercise').addEventListener('click', startExercise);
    document.getElementById('submitAnswer').addEventListener('click', checkAnswer);
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
}

function updateExerciseProgress() {
    // Score and progress removed from UI
    // Kept for internal tracking
}

async function startExercise() {
    // Show loading state
    const exerciseContent = document.getElementById('exerciseContent');
    exerciseContent.innerHTML = '<p class="loading">Loading words...</p>';
    
    const savedWords = await getSavedWords();
    
    if (savedWords.length < 3) {
        exerciseContent.innerHTML = '<p class="error">You need at least 3 saved words to start the exercise!</p>';
        setTimeout(() => {
            exerciseContent.innerHTML = `
                <h2>Practice Your Words</h2>
                <p>Test your vocabulary knowledge with spaced repetition exercises.</p>
                <button id="startExercise" class="primary-btn">Start Exercise</button>
            `;
            document.getElementById('startExercise').addEventListener('click', startExercise);
        }, 3000);
        return;
    }
    
    // Get words due for review (uses spaced repetition)
    let dueWords = await getWordsDueForReview();
    
    // If less than 5 words are due, add some random words to make it more interesting
    if (dueWords.length < 5 && savedWords.length > dueWords.length) {
        const notDueWords = savedWords.filter(word => 
            !dueWords.find(dueWord => dueWord.word.toLowerCase() === word.word.toLowerCase())
        );
        const additionalWords = notDueWords
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(5 - dueWords.length, notDueWords.length));
        
        exerciseWords = [...dueWords, ...additionalWords];
    } else if (dueWords.length === 0) {
        // No words due, use random selection
        exerciseWords = savedWords.sort(() => Math.random() - 0.5).slice(0, 10);
    } else {
        exerciseWords = dueWords;
    }
    
    // Add slight randomization while keeping priority on due words
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
    
    // Reset the exercise content HTML
    exerciseContent.innerHTML = `
        <h2>Practice Your Words</h2>
        <p>Test your vocabulary knowledge with spaced repetition exercises.</p>
        <button id="startExercise" class="primary-btn">Start Exercise</button>
    `;
    
    document.getElementById('exerciseContent').style.display = 'none';
    document.getElementById('exerciseQuiz').style.display = 'block';
    document.getElementById('exerciseResults').style.display = 'none';
    
    updateExerciseProgress();
    showQuestion();
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
    answerInput.focus();
    
    document.getElementById('answerFeedback').innerHTML = '';
    document.getElementById('submitAnswer').style.display = 'inline-block';
    document.getElementById('nextQuestion').style.display = 'none';
    
    // Keep word stats hidden (minimalist approach)
    // document.getElementById('wordStats').classList.remove('visible');
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
    
    // Disable input and submit button
    answerInput.disabled = true;
    document.getElementById('submitAnswer').style.display = 'none';
    
    // Update spaced repetition data
    await updateWordReview(currentWord.word, isCorrect);
    
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
        correctAnswers++;
        updateExerciseProgress();
    } else {
        // Word answered incorrectly - add it back to the queue
        // Insert it 2-3 positions ahead (or at the end if near the end)
        const insertPosition = Math.min(
            currentQuestionIndex + Math.floor(Math.random() * 2) + 2,
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

function resetExercise() {
    document.getElementById('exerciseContent').style.display = 'block';
    document.getElementById('exerciseQuiz').style.display = 'none';
    document.getElementById('exerciseResults').style.display = 'none';
    correctAnswers = 0;
    currentQuestionIndex = 0;
    masteredWords.clear();
    totalAttempts = 0;
    updateExerciseProgress();
}
