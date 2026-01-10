import { getSavedWords, getWordsDueForReview, updateWordReview } from './storage.js';

let exerciseWords = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;

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

function startExercise() {
    const savedWords = getSavedWords();
    
    if (savedWords.length < 3) {
        alert('You need at least 3 saved words to start the exercise!');
        return;
    }
    
    // Get words due for review (uses spaced repetition)
    let dueWords = getWordsDueForReview();
    
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
    
    document.getElementById('exerciseContent').style.display = 'none';
    document.getElementById('exerciseQuiz').style.display = 'block';
    document.getElementById('exerciseResults').style.display = 'none';
    
    updateExerciseProgress();
    showQuestion();
}

function showQuestion() {
    if (currentQuestionIndex >= exerciseWords.length) {
        showResults();
        return;
    }
    
    const currentWord = exerciseWords[currentQuestionIndex];
    
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
}

function checkAnswer() {
    const answerInput = document.getElementById('answerInput');
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentWord = exerciseWords[currentQuestionIndex];
    const correctWord = currentWord.word.toLowerCase();
    
    if (!userAnswer) {
        return; // Don't submit empty answers
    }
    
    const isCorrect = userAnswer === correctWord;
    const feedbackDiv = document.getElementById('answerFeedback');
    
    // Disable input and submit button
    answerInput.disabled = true;
    document.getElementById('submitAnswer').style.display = 'none';
    
    // Update spaced repetition data
    updateWordReview(currentWord.word, isCorrect);
    
    if (isCorrect) {
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
        // Show the correct word in the example sentence for incorrect answers
        const exampleWithWord = currentWord.example 
            ? currentWord.example.replace(
                new RegExp(currentWord.word, 'gi'), 
                `<mark class="highlight-word">${currentWord.word}</mark>`
            )
            : `Example with "<mark class="highlight-word">${currentWord.word}</mark>"`;
        
        document.getElementById('exampleSentence').innerHTML = `<em>"${exampleWithWord}"</em>`;
        
        // No feedback message - user can see the highlighted word
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
    
    const percentage = Math.round((correctAnswers / exerciseWords.length) * 100);
    document.getElementById('finalScore').textContent = `${correctAnswers}/${exerciseWords.length} (${percentage}%)`;
}

function resetExercise() {
    document.getElementById('exerciseContent').style.display = 'block';
    document.getElementById('exerciseQuiz').style.display = 'none';
    document.getElementById('exerciseResults').style.display = 'none';
    correctAnswers = 0;
    currentQuestionIndex = 0;
    updateExerciseProgress();
}
