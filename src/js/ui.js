import { getSavedWords, deleteWord } from './storage.js';

export function displaySavedWords() {
    const savedWordsList = document.getElementById('savedWordsList');
    const words = getSavedWords();
    
    if (words.length === 0) {
        savedWordsList.innerHTML = '<p class="empty-state">No saved words yet. Look up a word to get started!</p>';
        return;
    }
    
    savedWordsList.innerHTML = words.map((item, index) => `
        <div class="saved-word-item">
            <div class="saved-word-header">
                <h4>${item.word}</h4>
                <button class="delete-btn" data-word="${item.word}" data-index="${index}" title="Delete">×</button>
            </div>
            <p class="saved-definition">${item.definition}</p>
            <span class="saved-timestamp">${new Date(item.timestamp).toLocaleDateString()}</span>
        </div>
    `).join('');
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const word = e.target.getAttribute('data-word');
            deleteWord(word);
            displaySavedWords();
        });
    });
}

export function initTabs() {
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
            
            // Update saved words list when switching to saved words tab
            if (targetTab === 'saved') {
                displaySavedWords();
            }
        });
    });
}
