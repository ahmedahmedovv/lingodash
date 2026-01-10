import { getSavedWords } from './storage.js';

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
        if (e.key === 'Enter' && !e.target.disabled) {
            checkAnswer();
        }
    });
}

function updateExerciseProgress() {
    document.getElementById('exerciseScore').textContent = `Score: ${correctAnswers}`;
    document.getElementById('exerciseProgress').textContent = `${currentQuestionIndex}/${exerciseWords.length}`;
}

function startExercise() {
    const savedWords = getSavedWords();
    
    if (savedWords.length < 3) {
        alert('You need at least 3 saved words to start the exercise!');
        return;
    }
    
    // Shuffle words for random order
    exerciseWords = savedWords.sort(() => Math.random() - 0.5);
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
    
    // Show the definition
    document.getElementById('definitionDisplay').textContent = currentWord.definition;
    
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
    
    if (isCorrect) {
        feedbackDiv.innerHTML = `
            <div class="feedback-correct">
                ✅ Correct! The answer is "<strong>${currentWord.word}</strong>"
            </div>
        `;
        answerInput.classList.add('correct-input');
        correctAnswers++;
        updateExerciseProgress();
    } else {
        feedbackDiv.innerHTML = `
            <div class="feedback-incorrect">
                ❌ Incorrect. The correct answer is "<strong>${currentWord.word}</strong>"
            </div>
        `;
        answerInput.classList.add('incorrect-input');
    }
    
    currentQuestionIndex++;
    updateExerciseProgress();
    document.getElementById('nextQuestion').style.display = 'block';
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
