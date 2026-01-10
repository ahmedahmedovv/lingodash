// LocalStorage functions
export function getSavedWords() {
    const saved = localStorage.getItem('lingodash_words');
    return saved ? JSON.parse(saved) : [];
}

export function saveWord(word, definition, example = '') {
    const words = getSavedWords();
    
    // Check if word already exists
    const existingWordIndex = words.findIndex(item => item.word.toLowerCase() === word.toLowerCase());
    
    if (existingWordIndex !== -1) {
        // Update existing word but preserve spaced repetition data
        words[existingWordIndex] = {
            ...words[existingWordIndex],
            definition: definition,
            example: example || words[existingWordIndex].example,
            timestamp: new Date().toISOString()
        };
    } else {
        // Add new word at the beginning with initial spaced repetition data
        words.unshift({
            word: word,
            definition: definition,
            example: example || `Example sentence with "${word}" will be added here.`,
            timestamp: new Date().toISOString(),
            // Spaced repetition data
            interval: 0, // Days until next review (0 = new word, needs immediate review)
            easeFactor: 2.5, // Multiplier for interval increase
            nextReview: new Date().toISOString(), // Due immediately for new words
            reviewCount: 0,
            correctCount: 0
        });
    }
    
    // Keep only last 50 words
    const limitedWords = words.slice(0, 50);
    
    localStorage.setItem('lingodash_words', JSON.stringify(limitedWords));
}

// Update spaced repetition data after reviewing a word
export function updateWordReview(word, isCorrect) {
    const words = getSavedWords();
    const wordIndex = words.findIndex(item => item.word.toLowerCase() === word.toLowerCase());
    
    if (wordIndex === -1) return;
    
    const wordData = words[wordIndex];
    
    // Initialize spaced repetition data if missing (for backwards compatibility)
    if (wordData.interval === undefined) {
        wordData.interval = 0;
        wordData.easeFactor = 2.5;
        wordData.reviewCount = 0;
        wordData.correctCount = 0;
    }
    
    wordData.reviewCount = (wordData.reviewCount || 0) + 1;
    
    if (isCorrect) {
        wordData.correctCount = (wordData.correctCount || 0) + 1;
        
        // Increase interval based on current level
        if (wordData.interval === 0) {
            wordData.interval = 1; // First correct: review tomorrow
        } else if (wordData.interval === 1) {
            wordData.interval = 3; // Second correct: review in 3 days
        } else {
            // Subsequent correct answers: multiply by ease factor
            wordData.interval = Math.round(wordData.interval * wordData.easeFactor);
        }
        
        // Cap interval at 365 days (1 year)
        wordData.interval = Math.min(wordData.interval, 365);
        
        // Increase ease factor slightly for consistent success
        wordData.easeFactor = Math.min(wordData.easeFactor + 0.1, 3.0);
    } else {
        // Incorrect answer: reset to short interval
        wordData.interval = 0; // Review again in this session
        
        // Decrease ease factor for struggled words
        wordData.easeFactor = Math.max(wordData.easeFactor - 0.2, 1.3);
    }
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + wordData.interval);
    wordData.nextReview = nextReviewDate.toISOString();
    
    words[wordIndex] = wordData;
    localStorage.setItem('lingodash_words', JSON.stringify(words));
}

// Get words that are due for review
export function getWordsDueForReview() {
    const allWords = getSavedWords();
    const now = new Date();
    
    // Filter words that are due for review
    const dueWords = allWords.filter(word => {
        // Initialize spaced repetition data if missing
        if (word.nextReview === undefined) {
            return true; // Include words without review data
        }
        return new Date(word.nextReview) <= now;
    });
    
    // Sort by next review date (most overdue first)
    dueWords.sort((a, b) => {
        const aDate = a.nextReview ? new Date(a.nextReview) : new Date(0);
        const bDate = b.nextReview ? new Date(b.nextReview) : new Date(0);
        return aDate - bDate;
    });
    
    return dueWords;
}

export function deleteWord(word) {
    const words = getSavedWords();
    const filteredWords = words.filter(item => item.word.toLowerCase() !== word.toLowerCase());
    localStorage.setItem('lingodash_words', JSON.stringify(filteredWords));
}

export function clearAllWords() {
    if (confirm('Are you sure you want to clear all saved words?')) {
        localStorage.removeItem('lingodash_words');
        return true;
    }
    return false;
}

// Export words in different formats
export function exportWords(format = 'json') {
    const words = getSavedWords();
    
    if (words.length === 0) {
        alert('No words to export!');
        return;
    }
    
    let content, filename, mimeType;
    
    if (format === 'csv') {
        // CSV format
        const headers = ['Word', 'Definition', 'Example', 'Date Added', 'Review Count', 'Correct Count', 'Next Review', 'Interval (days)'];
        const csvRows = [headers.join(',')];
        
        words.forEach(word => {
            const row = [
                `"${word.word}"`,
                `"${word.definition.replace(/"/g, '""')}"`,
                `"${(word.example || '').replace(/"/g, '""')}"`,
                `"${new Date(word.timestamp).toLocaleDateString()}"`,
                word.reviewCount || 0,
                word.correctCount || 0,
                word.nextReview ? `"${new Date(word.nextReview).toLocaleDateString()}"` : '""',
                word.interval || 0
            ];
            csvRows.push(row.join(','));
        });
        
        content = csvRows.join('\n');
        filename = `lingodash-vocabulary-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
    } else {
        // JSON format (default)
        content = JSON.stringify(words, null, 2);
        filename = `lingodash-vocabulary-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
    }
    
    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
