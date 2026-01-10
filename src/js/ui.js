import { getSavedWords, deleteWord, exportWords } from './storage.js';

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

export function showExportMenu() {
    // Create export format selection buttons
    const exportOverlay = document.createElement('div');
    exportOverlay.className = 'export-overlay';
    exportOverlay.innerHTML = `
        <div class="export-modal">
            <h3>Choose Export Format</h3>
            <p>Select the format you'd like to export your vocabulary:</p>
            <div class="export-buttons">
                <button class="export-format-btn" data-format="json">
                    📄 JSON
                    <span class="format-desc">Complete data with all fields</span>
                </button>
                <button class="export-format-btn" data-format="csv">
                    📊 CSV
                    <span class="format-desc">Spreadsheet format</span>
                </button>
            </div>
            <button class="export-cancel-btn">Cancel</button>
        </div>
    `;
    
    document.body.appendChild(exportOverlay);
    
    // Add event listeners
    exportOverlay.querySelectorAll('.export-format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.getAttribute('data-format');
            exportWords(format);
            document.body.removeChild(exportOverlay);
        });
    });
    
    exportOverlay.querySelector('.export-cancel-btn').addEventListener('click', () => {
        document.body.removeChild(exportOverlay);
    });
    
    // Close on overlay click
    exportOverlay.addEventListener('click', (e) => {
        if (e.target === exportOverlay) {
            document.body.removeChild(exportOverlay);
        }
    });
}
