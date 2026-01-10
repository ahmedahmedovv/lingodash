const MISTRAL_API_KEY = 'UyFZtjZY3r5aNe1th2qtx6IBLynCc0ai';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const textInput = document.getElementById('textInput');
const definitionBox = document.getElementById('definitionBox');
const definitionContent = document.getElementById('definitionContent');
const savedWordsList = document.getElementById('savedWordsList');
const clearHistoryBtn = document.getElementById('clearHistory');

let debounceTimeout;

// LocalStorage functions
function getSavedWords() {
    const saved = localStorage.getItem('lingodash_words');
    return saved ? JSON.parse(saved) : [];
}

function saveWord(word, definition) {
    const words = getSavedWords();
    
    // Check if word already exists and remove it (to avoid duplicates)
    const filteredWords = words.filter(item => item.word.toLowerCase() !== word.toLowerCase());
    
    // Add new word at the beginning
    filteredWords.unshift({
        word: word,
        definition: definition,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 words
    const limitedWords = filteredWords.slice(0, 50);
    
    localStorage.setItem('lingodash_words', JSON.stringify(limitedWords));
    displaySavedWords();
}

function deleteWord(word) {
    const words = getSavedWords();
    const filteredWords = words.filter(item => item.word.toLowerCase() !== word.toLowerCase());
    localStorage.setItem('lingodash_words', JSON.stringify(filteredWords));
    displaySavedWords();
}

function clearAllWords() {
    if (confirm('Are you sure you want to clear all saved words?')) {
        localStorage.removeItem('lingodash_words');
        displaySavedWords();
    }
}

function displaySavedWords() {
    const words = getSavedWords();
    
    if (words.length === 0) {
        savedWordsList.innerHTML = '<p class="empty-state">No saved words yet. Look up a word to get started!</p>';
        return;
    }
    
    savedWordsList.innerHTML = words.map(item => `
        <div class="saved-word-item">
            <div class="saved-word-header">
                <h4>${item.word}</h4>
                <button class="delete-btn" onclick="deleteWord('${item.word}')" title="Delete">×</button>
            </div>
            <p class="saved-definition">${item.definition}</p>
            <span class="saved-timestamp">${new Date(item.timestamp).toLocaleDateString()}</span>
        </div>
    `).join('');
}

async function getWordDefinition(word) {
    if (!word.trim()) {
        definitionBox.classList.remove('visible');
        return;
    }

    // Show loading state
    definitionBox.classList.add('visible');
    definitionContent.innerHTML = '<p class="loading">Looking up definition...</p>';

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [{
                    role: 'user',
                    content: `Provide a brief, clear definition of the word "${word}". Keep it concise (2-3 sentences maximum). If it's not a valid word, say so briefly.`
                }],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const definition = data.choices[0].message.content;

        definitionContent.innerHTML = `
            <h3>${word}</h3>
            <p>${definition}</p>
            <button class="save-btn" onclick="saveWordManually('${word}', \`${definition.replace(/`/g, '\\`').replace(/'/g, "\\'")}\`)">💾 Save Word</button>
        `;
        
        // Automatically save the word to localStorage
        saveWord(word, definition);
    } catch (error) {
        console.error('Error fetching definition:', error);
        let errorMessage = error.message;
        if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'API authentication failed. Please check your API key.';
        } else if (error.message.includes('429') || error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please wait or upgrade your plan.';
        }
        definitionContent.innerHTML = `
            <p class="error">${errorMessage}</p>
        `;
    }
}

textInput.addEventListener('input', (e) => {
    const word = e.target.value.trim();
    
    // Clear existing timeout
    clearTimeout(debounceTimeout);
    
    // Set new timeout to avoid too many API calls
    debounceTimeout = setTimeout(() => {
        if (word) {
            getWordDefinition(word);
        } else {
            definitionBox.classList.remove('visible');
        }
    }, 800); // Wait 800ms after user stops typing
});

// Also trigger on Enter key
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(debounceTimeout);
        getWordDefinition(e.target.value.trim());
    }
});

// Tab switching functionality
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            document.getElementById(`${targetTab}-panel`).classList.add('active');
        });
    });
}

// Clear history button
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearAllWords);
}

// Make functions available globally for inline onclick handlers
window.deleteWord = deleteWord;
window.saveWordManually = (word, definition) => {
    saveWord(word, definition);
    alert('Word saved!');
};

// Exercise functionality
let exerciseWords = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;

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

function updateExerciseProgress() {
    document.getElementById('exerciseScore').textContent = `Score: ${correctAnswers}`;
    document.getElementById('exerciseProgress').textContent = `${currentQuestionIndex}/${exerciseWords.length}`;
}

function showQuestion() {
    if (currentQuestionIndex >= exerciseWords.length) {
        showResults();
        return;
    }
    
    const currentWord = exerciseWords[currentQuestionIndex];
    document.getElementById('questionWord').textContent = currentWord.word;
    
    // Generate answer options (1 correct + 3 random wrong answers)
    const options = [currentWord];
    const otherWords = exerciseWords.filter(w => w.word !== currentWord.word);
    
    // Add 3 random wrong answers
    while (options.length < 4 && otherWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherWords.length);
        options.push(otherWords.splice(randomIndex, 1)[0]);
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    // Display options
    const answerOptionsDiv = document.getElementById('answerOptions');
    answerOptionsDiv.innerHTML = options.map((option, index) => `
        <button class="answer-option" onclick="checkAnswer('${option.word}', '${currentWord.word}', ${index})">
            ${option.definition}
        </button>
    `).join('');
    
    document.getElementById('nextQuestion').style.display = 'none';
}

function checkAnswer(selectedWord, correctWord, optionIndex) {
    const options = document.querySelectorAll('.answer-option');
    const isCorrect = selectedWord === correctWord;
    
    // Disable all buttons
    options.forEach(btn => btn.disabled = true);
    
    if (isCorrect) {
        options[optionIndex].classList.add('correct');
        correctAnswers++;
        updateExerciseProgress();
    } else {
        options[optionIndex].classList.add('incorrect');
        // Highlight the correct answer
        options.forEach((btn, idx) => {
            if (btn.textContent.trim() === exerciseWords[currentQuestionIndex].definition) {
                btn.classList.add('correct');
            }
        });
    }
    
    currentQuestionIndex++;
    updateExerciseProgress();
    document.getElementById('nextQuestion').style.display = 'block';
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

// Event listeners for exercise
document.getElementById('startExercise').addEventListener('click', startExercise);
document.getElementById('nextQuestion').addEventListener('click', showQuestion);
document.getElementById('restartExercise').addEventListener('click', resetExercise);

// Make checkAnswer available globally
window.checkAnswer = checkAnswer;

// Initialize on page load
initTabs();
displaySavedWords();
