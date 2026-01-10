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

// Display saved words on page load
displaySavedWords();
