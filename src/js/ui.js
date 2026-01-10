import { getSavedWords, deleteWord, updateWord, exportWords } from './storage.js';

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function displaySavedWords() {
    const savedWordsList = document.getElementById('savedWordsList');
    
    // Show loading state
    savedWordsList.innerHTML = '<p class="loading">Loading words...</p>';
    
    const words = await getSavedWords();
    
    if (words.length === 0) {
        savedWordsList.innerHTML = '<p class="empty-state">No saved words yet</p>';
        return;
    }
    
    savedWordsList.innerHTML = words.map((item, index) => `
        <div class="saved-word-item">
            <div class="saved-word-header">
                <span class="saved-word-title">${item.word}</span>
                <div class="saved-word-actions">
                    <button class="edit-btn" data-word="${item.word}" data-definition="${escapeAttr(item.definition)}" data-example="${escapeAttr(item.example || '')}" data-index="${index}">✎</button>
                    <button class="delete-btn" data-word="${item.word}" data-index="${index}">×</button>
                </div>
            </div>
            <p class="saved-definition">${item.definition}</p>
            ${item.example ? `<p class="saved-example">${item.example}</p>` : ''}
        </div>
    `).join('');
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const word = e.target.getAttribute('data-word');
            const success = await deleteWord(word);
            if (success) {
                await displaySavedWords();
            } else {
                alert('Failed to delete word. Please try again.');
            }
        });
    });

    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const word = e.target.getAttribute('data-word');
            const definition = e.target.getAttribute('data-definition');
            const example = e.target.getAttribute('data-example');
            showEditModal(word, definition, example);
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

export function showEditModal(word, definition, example) {
    const editOverlay = document.createElement('div');
    editOverlay.className = 'edit-overlay';
    editOverlay.innerHTML = `
        <div class="edit-modal">
            <h3>Edit Word</h3>
            <div class="edit-form">
                <div class="edit-field">
                    <label for="edit-word">Word</label>
                    <input type="text" id="edit-word" value="${escapeAttr(word)}" />
                </div>
                <div class="edit-field">
                    <label for="edit-definition">Definition</label>
                    <textarea id="edit-definition" rows="3">${definition}</textarea>
                </div>
                <div class="edit-field">
                    <label for="edit-example">Example</label>
                    <textarea id="edit-example" rows="2">${example}</textarea>
                </div>
            </div>
            <div class="edit-error" style="display: none;"></div>
            <div class="edit-buttons">
                <button class="edit-save-btn">Save</button>
                <button class="edit-cancel-btn">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(editOverlay);

    const originalWord = word;
    const wordInput = editOverlay.querySelector('#edit-word');
    const definitionInput = editOverlay.querySelector('#edit-definition');
    const exampleInput = editOverlay.querySelector('#edit-example');
    const errorDiv = editOverlay.querySelector('.edit-error');
    const saveBtn = editOverlay.querySelector('.edit-save-btn');

    // Focus on word input
    wordInput.focus();
    wordInput.select();

    // Save handler
    const handleSave = async () => {
        const newWord = wordInput.value.trim();
        const newDefinition = definitionInput.value.trim();
        const newExample = exampleInput.value.trim();

        if (!newWord || !newDefinition) {
            errorDiv.textContent = 'Word and definition are required.';
            errorDiv.style.display = 'block';
            return;
        }

        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const result = await updateWord(originalWord, newWord, newDefinition, newExample);

        if (result === true) {
            document.body.removeChild(editOverlay);
            await displaySavedWords();
        } else if (result && result.error === 'duplicate') {
            errorDiv.textContent = result.message;
            errorDiv.style.display = 'block';
            saveBtn.textContent = 'Save';
            saveBtn.disabled = false;
        } else {
            errorDiv.textContent = 'Failed to update word. Please try again.';
            errorDiv.style.display = 'block';
            saveBtn.textContent = 'Save';
            saveBtn.disabled = false;
        }
    };

    saveBtn.addEventListener('click', handleSave);

    // Enter key to save (only in word input, not textareas)
    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    });

    // Cancel handler
    const closeModal = () => {
        document.body.removeChild(editOverlay);
    };

    editOverlay.querySelector('.edit-cancel-btn').addEventListener('click', closeModal);

    // Close on overlay click
    editOverlay.addEventListener('click', (e) => {
        if (e.target === editOverlay) {
            closeModal();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}
