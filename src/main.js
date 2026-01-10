import './css/style.css';
import { initLookup } from './js/lookup.js';
import { initTabs, displaySavedWords } from './js/ui.js';
import { initExercise } from './js/exercise.js';
import { clearAllWords } from './js/storage.js';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    initTabs();
    
    // Initialize lookup functionality
    initLookup();
    
    // Display saved words
    displaySavedWords();
    
    // Initialize exercise
    initExercise();
    
    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (clearAllWords()) {
                displaySavedWords();
            }
        });
    }
});
