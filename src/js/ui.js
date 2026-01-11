import { getSavedWordsPaginated, deleteWord, updateWord, exportWords } from './storage.js';
import { regenerateWordExample } from './api.js';

// Pagination and filter state
let currentPage = 1;
let currentFilter = 'all';
const PAGE_SIZE = 50;

// Empty state messages for each filter
const EMPTY_MESSAGES = {
    all: 'No saved words yet',
    new: 'No new words. All words have been reviewed!',
    learning: 'No words in learning phase',
    mastered: 'No mastered words yet. Keep practicing!',
    due: 'No words due for review. Great job!'
};

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Get status badge HTML for a word based on spaced repetition data
function getWordStatusBadge(word) {
    if (word.reviewCount === 0) {
        return '<span class="word-badge new">New</span>';
    }

    const now = new Date();
    const nextReview = new Date(word.nextReview);

    if (nextReview <= now) {
        return '<span class="word-badge overdue">Due</span>';
    }

    if (word.interval >= 30) {
        return '<span class="word-badge mastered">Mastered</span>';
    }

    if (word.interval < 10) {
        return '<span class="word-badge learning">Learning</span>';
    }

    return '';
}

// Update filter button active states
function updateFilterButtons(activeFilter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
}

function renderPaginationControls(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    const pages = [];
    const maxVisible = 5;

    // Calculate range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Previous button
    pages.push(`<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`);

    // First page + ellipsis
    if (startPage > 1) {
        pages.push(`<button class="pagination-btn" data-page="1">1</button>`);
        if (startPage > 2) {
            pages.push(`<span class="pagination-ellipsis">...</span>`);
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(`<span class="pagination-ellipsis">...</span>`);
        }
        pages.push(`<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`);
    }

    // Next button
    pages.push(`<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`);

    return pages.join('');
}

export async function displaySavedWords(page = 1, filter = currentFilter) {
    const savedWordsList = document.getElementById('savedWordsList');
    const paginationControls = document.getElementById('paginationControls');

    // Update filter state
    currentFilter = filter;
    updateFilterButtons(filter);

    // Show loading state
    savedWordsList.innerHTML = '<p class="loading">Loading words...</p>';
    paginationControls.innerHTML = '';

    const { words, totalCount, totalPages, currentPage: fetchedPage } = await getSavedWordsPaginated(page, PAGE_SIZE, filter);
    currentPage = fetchedPage;

    if (words.length === 0) {
        savedWordsList.innerHTML = `<p class="empty-state">${EMPTY_MESSAGES[filter] || EMPTY_MESSAGES.all}</p>`;
        paginationControls.innerHTML = '';
        return;
    }

    savedWordsList.innerHTML = words.map((item, index) => `
        <div class="saved-word-item">
            <div class="saved-word-header">
                <span class="saved-word-title">${item.word}</span>
                ${getWordStatusBadge(item)}
                <div class="saved-word-actions">
                    <button class="edit-btn" data-word="${item.word}" data-definition="${escapeAttr(item.definition)}" data-example="${escapeAttr(item.example || '')}" data-index="${index}">✎</button>
                    <button class="delete-btn" data-word="${item.word}" data-index="${index}">×</button>
                </div>
            </div>
            <p class="saved-definition">${item.definition}</p>
            ${item.example ? `<p class="saved-example">${item.example}</p>` : ''}
        </div>
    `).join('');

    // Render pagination controls
    paginationControls.innerHTML = renderPaginationControls(currentPage, totalPages);

    // Add event listeners for pagination buttons
    paginationControls.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetPage = parseInt(e.target.getAttribute('data-page'), 10);
            if (!isNaN(targetPage) && targetPage !== currentPage) {
                await displaySavedWords(targetPage, currentFilter);
                // Scroll to top of the list
                savedWordsList.scrollTop = 0;
            }
        });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const word = e.target.getAttribute('data-word');
            const success = await deleteWord(word);
            if (success) {
                // Stay on current page, or go to previous if current page is empty
                const pageToShow = words.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                await displaySavedWords(pageToShow);
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

        // Validate that the word appears in the example
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
            await displaySavedWords(currentPage);
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

    // Add event listener for regenerate button
    const regenerateBtn = editOverlay.querySelector('.edit-regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regenerateExample);
    }

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

// Regenerate example functionality for edit modal
async function regenerateExample() {
    // Find the example input in the currently open edit modal
    const exampleInput = document.getElementById('edit-example');
    const regenerateBtn = document.querySelector('.edit-regenerate-btn');
    const wordInput = document.getElementById('edit-word');

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
        // Call AI to generate new example (may take multiple attempts)
        let attempts = 0;
        const maxAttempts = 3;
        let newExample = null;

        while (attempts < maxAttempts && !newExample) {
            attempts++;
            console.log('🔄 Regenerate Example: Making API call, attempt:', attempts);

            const result = await regenerateWordExample(currentWord);
            console.log('🔄 Regenerate Example: API response:', result);

            // Validate that the word appears in the example
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

            // Rate limiting between attempts
            if (!newExample && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update the example input with the new example (live preview)
        console.log('🔄 Regenerate Example: Updating example input with new example');
        exampleInput.value = newExample;

        // Success feedback
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

// Helper function to check if word appears in example
function containsWord(example, targetWord) {
    console.log('🔍 Word Validation: Checking if', targetWord, 'appears in:', example);

    if (!example || !targetWord) {
        console.log('🔍 Word Validation: Missing parameters');
        return false;
    }

    // Case-insensitive check for the word (word boundaries to avoid partial matches)
    const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
    const result = regex.test(example);
    console.log('🔍 Word Validation: Regex test result:', result);

    return result;
}

// Word validation function
export function validateWordExample(word, example) {
    if (!word || !word.trim()) {
        return { valid: false, error: "Word is required" };
    }

    if (!example || !example.trim()) {
        return { valid: false, error: "Example sentence is required" };
    }

    // Case-insensitive check for the word (word boundaries to avoid partial matches)
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    const containsWord = regex.test(example);

    if (!containsWord) {
        return {
            valid: false,
            error: `The word "${word}" must appear in the example sentence`
        };
    }

    return { valid: true };
}

// Initialize filter button event listeners
export function initFilterControls() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            if (filter !== currentFilter) {
                displaySavedWords(1, filter); // Reset to page 1 when changing filter
            }
        });
    });
}
