/**
 * UI Modals Module
 * Handles modal dialogs for editing and exporting
 */

import { updateWord, exportWords } from '../storage/index.js';
import { regenerateWordExample } from '../api.js';
import { displaySavedWords, getCurrentPage } from './savedWords.js';
import { validateWordExample, containsWord } from './validation.js';

/**
 * Escape HTML attributes
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Show export format selection menu
 */
export function showExportMenu() {
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

    exportOverlay.addEventListener('click', (e) => {
        if (e.target === exportOverlay) {
            document.body.removeChild(exportOverlay);
        }
    });
}

/**
 * Show edit word modal
 * @param {string} word - Word to edit
 * @param {string} definition - Current definition
 * @param {string} example - Current example
 */
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
                    <div class="example-field-group">
                        <textarea id="edit-example" rows="2">${example}</textarea>
                        <button class="edit-regenerate-btn" type="button">🔄 Regenerate Example</button>
                    </div>
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

    wordInput.focus();
    wordInput.select();

    const handleSave = async () => {
        const newWord = wordInput.value.trim();
        const newDefinition = definitionInput.value.trim();
        const newExample = exampleInput.value.trim();

        if (!newWord || !newDefinition) {
            errorDiv.textContent = 'Word and definition are required.';
            errorDiv.style.display = 'block';
            return;
        }

        const validation = validateWordExample(newWord, newExample);
        if (!validation.valid) {
            errorDiv.textContent = validation.error;
            errorDiv.style.display = 'block';
            exampleInput.focus();
            return;
        }

        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const result = await updateWord(originalWord, newWord, newDefinition, newExample);

        if (result === true) {
            document.body.removeChild(editOverlay);
            await displaySavedWords(getCurrentPage());
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

    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    });

    // Regenerate example button handler
    const regenerateBtn = editOverlay.querySelector('.edit-regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => regenerateExample(wordInput, exampleInput, regenerateBtn));
    }

    const closeModal = () => {
        document.body.removeChild(editOverlay);
    };

    editOverlay.querySelector('.edit-cancel-btn').addEventListener('click', closeModal);

    editOverlay.addEventListener('click', (e) => {
        if (e.target === editOverlay) {
            closeModal();
        }
    });

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/**
 * Regenerate example sentence
 * @param {HTMLElement} wordInput - Word input element
 * @param {HTMLElement} exampleInput - Example input element
 * @param {HTMLElement} regenerateBtn - Regenerate button element
 */
async function regenerateExample(wordInput, exampleInput, regenerateBtn) {
    if (!exampleInput || !regenerateBtn || !wordInput) {
        console.log('❌ Regenerate Example: Required elements not found');
        return;
    }

    const currentWord = wordInput.value.trim();
    if (!currentWord) {
        console.log('❌ Regenerate Example: No word specified');
        return;
    }

    console.log('🔄 Regenerate Example: Starting for word:', currentWord);

    regenerateBtn.textContent = '🔄 Generating...';
    regenerateBtn.disabled = true;

    try {
        let attempts = 0;
        const maxAttempts = 3;
        let newExample = null;

        while (attempts < maxAttempts && !newExample) {
            attempts++;
            console.log('🔄 Regenerate Example: Making API call, attempt:', attempts);

            const result = await regenerateWordExample(currentWord);
            console.log('🔄 Regenerate Example: API response:', result);

            console.log('🔄 Regenerate Example: Checking if word appears in example...');
            if (result.example && containsWord(result.example, currentWord)) {
                newExample = result.example;
                console.log('✅ Regenerate Example: Valid example found:', newExample);
            } else if (attempts === maxAttempts) {
                console.error('❌ Regenerate Example: Failed after max attempts - could not generate valid example');
                throw new Error('Could not generate valid example containing the word');
            } else {
                console.log('⏳ Regenerate Example: Word not found in example, retrying in 1 second...');
            }

            if (!newExample && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('🔄 Regenerate Example: Updating example input with new example');
        exampleInput.value = newExample;

        regenerateBtn.textContent = '✅ Regenerated!';
        setTimeout(() => {
            regenerateBtn.textContent = '🔄 Regenerate Example';
            regenerateBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('❌ Regenerate Example: Final error:', error.message);
        regenerateBtn.textContent = '❌ Failed';
        setTimeout(() => {
            regenerateBtn.textContent = '🔄 Regenerate Example';
            regenerateBtn.disabled = false;
        }, 2000);
    }
}
