// LocalStorage functions
export function getSavedWords() {
    const saved = localStorage.getItem('lingodash_words');
    return saved ? JSON.parse(saved) : [];
}

export function saveWord(word, definition, example = '') {
    const words = getSavedWords();
    
    // Check if word already exists and remove it (to avoid duplicates)
    const filteredWords = words.filter(item => item.word.toLowerCase() !== word.toLowerCase());
    
    // Add new word at the beginning
    filteredWords.unshift({
        word: word,
        definition: definition,
        example: example || `Example sentence with "${word}" will be added here.`,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 words
    const limitedWords = filteredWords.slice(0, 50);
    
    localStorage.setItem('lingodash_words', JSON.stringify(limitedWords));
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
