import { getWordDefinition, getBatchWordDefinitions } from './api.js';
import { saveWord } from './storage.js';
import { displaySavedWords } from './ui.js';

const definitionBox = document.getElementById('definitionBox');
const definitionContent = document.getElementById('definitionContent');

let batchResults = [];

export function initLookup() {
    const textInput = document.getElementById('textInput');
    
    // Only trigger on Enter key - no automatic search while typing
    textInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const word = e.target.value.trim();
            if (word) {
                await lookupWord(word);
            }
        }
    });
    
    // Initialize batch mode toggle
    initBatchMode();
}

function initBatchMode() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const singleMode = document.getElementById('singleMode');
    const batchMode = document.getElementById('batchMode');
    const batchLookupBtn = document.getElementById('batchLookupBtn');
    const batchInput = document.getElementById('batchInput');
    
    // Toggle between single and batch mode
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            
            // Update button states
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide appropriate panels
            if (mode === 'single') {
                singleMode.style.display = 'block';
                batchMode.style.display = 'none';
            } else {
                singleMode.style.display = 'none';
                batchMode.style.display = 'block';
            }
        });
    });
    
    // Batch lookup button
    if (batchLookupBtn) {
        batchLookupBtn.addEventListener('click', async () => {
            const text = batchInput.value.trim();
            if (text) {
                const words = text.split('\n').map(w => w.trim()).filter(w => w);
                await batchLookup(words);
            }
        });
    }
}

async function lookupWord(word) {
    if (!word.trim()) {
        definitionBox.classList.remove('visible');
        return;
    }

    // Show loading state
    definitionBox.classList.add('visible');
    definitionContent.innerHTML = '<p class="loading">Looking up definition...</p>';

    try {
        const result = await getWordDefinition(word);

        definitionContent.innerHTML = `
            <h3>${result.word}</h3>
            <p><strong>Definition:</strong> ${result.definition}</p>
            ${result.example ? `<p class="example-text"><strong>Example:</strong> ${result.example}</p>` : ''}
            <button class="save-btn" id="saveWordBtn">💾 Save Word</button>
        `;
        
        // Add event listener for save button
        const saveBtn = document.getElementById('saveWordBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Save word to localStorage (fast operation)
                saveWord(result.word, result.definition, result.example);
                
                // Only update the UI if user is on the saved words tab
                // This prevents unnecessary DOM manipulation when user is on lookup tab
                const savedWordsPanel = document.getElementById('saved-panel');
                if (savedWordsPanel && savedWordsPanel.classList.contains('active')) {
                    displaySavedWords();
                }
                
                // Provide immediate visual feedback
                saveBtn.innerHTML = '✓ Saved!';
                saveBtn.style.background = '#27ae60';
                saveBtn.disabled = true;
                
                setTimeout(() => {
                    saveBtn.innerHTML = '💾 Save Word';
                    saveBtn.style.background = '';
                    saveBtn.disabled = false;
                }, 2000);
            });
        }
    } catch (error) {
        definitionContent.innerHTML = `
            <p class="error">${error.message}</p>
        `;
    }
}

async function batchLookup(words) {
    const batchLookupBtn = document.getElementById('batchLookupBtn');
    const batchProgress = document.getElementById('batchProgress');
    const batchResultsDiv = document.getElementById('batchResults');
    
    // Clear previous results
    batchResults = [];
    batchResultsDiv.innerHTML = '';
    
    // Show progress
    batchProgress.style.display = 'block';
    batchProgress.textContent = `Looking up ${words.length} word${words.length > 1 ? 's' : ''}...`;
    batchLookupBtn.disabled = true;
    
    try {
        // Fetch all definitions in parallel
        const results = await getBatchWordDefinitions(words);
        batchResults = results;
        
        // Hide progress
        batchProgress.style.display = 'none';
        batchLookupBtn.disabled = false;
        
        // Display results
        displayBatchResults(results);
        
    } catch (error) {
        batchProgress.textContent = `Error: ${error.message}`;
        batchProgress.style.color = '#e74c3c';
        batchLookupBtn.disabled = false;
    }
}

function displayBatchResults(results) {
    const batchResultsDiv = document.getElementById('batchResults');
    
    if (results.length === 0) {
        batchResultsDiv.innerHTML = '<p class="empty-state">No results to display.</p>';
        return;
    }
    
    // Display results
    batchResultsDiv.innerHTML = results.map((result, index) => {
        if (result.success) {
            return `
                <div class="batch-result-card" data-index="${index}">
                    <div class="batch-result-header">
                        <h4>${result.word}</h4>
                        <button class="save-btn batch-save-btn" data-index="${index}">💾 Save</button>
                    </div>
                    <p><strong>Definition:</strong> ${result.definition}</p>
                    ${result.example ? `<p class="example-text"><strong>Example:</strong> ${result.example}</p>` : ''}
                </div>
            `;
        } else {
            return `
                <div class="batch-result-card error" data-index="${index}">
                    <div class="batch-result-header">
                        <h4>${result.word}</h4>
                    </div>
                    <p class="error">${result.error}</p>
                </div>
            `;
        }
    }).join('');
    
    // Add batch actions
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
        const actionsHtml = `
            <div class="batch-actions">
                <button id="batchSaveAllBtn" class="batch-save-all-btn">💾 Save All (${successCount})</button>
                <button id="batchClearBtn" class="batch-clear-btn">Clear Results</button>
            </div>
        `;
        batchResultsDiv.insertAdjacentHTML('afterend', actionsHtml);
        
        // Add event listeners for individual save buttons
        document.querySelectorAll('.batch-save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const result = batchResults[index];
                if (result.success) {
                    saveWord(result.word, result.definition, result.example);
                    
                    // Update button state
                    e.target.innerHTML = '✓ Saved!';
                    e.target.style.background = '#27ae60';
                    e.target.disabled = true;
                    
                    // Update saved words tab if visible
                    const savedWordsPanel = document.getElementById('saved-panel');
                    if (savedWordsPanel && savedWordsPanel.classList.contains('active')) {
                        displaySavedWords();
                    }
                }
            });
        });
        
        // Save all button
        const saveAllBtn = document.getElementById('batchSaveAllBtn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => {
                let savedCount = 0;
                batchResults.forEach(result => {
                    if (result.success) {
                        saveWord(result.word, result.definition, result.example);
                        savedCount++;
                    }
                });
                
                // Update button state
                saveAllBtn.innerHTML = `✓ Saved ${savedCount} word${savedCount > 1 ? 's' : ''}!`;
                saveAllBtn.style.background = '#229954';
                saveAllBtn.disabled = true;
                
                // Disable individual save buttons
                document.querySelectorAll('.batch-save-btn').forEach(btn => {
                    btn.innerHTML = '✓ Saved!';
                    btn.style.background = '#27ae60';
                    btn.disabled = true;
                });
                
                // Update saved words tab if visible
                const savedWordsPanel = document.getElementById('saved-panel');
                if (savedWordsPanel && savedWordsPanel.classList.contains('active')) {
                    displaySavedWords();
                }
            });
        }
        
        // Clear button
        const clearBtn = document.getElementById('batchClearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                batchResults = [];
                batchResultsDiv.innerHTML = '';
                const actionsDiv = document.querySelector('.batch-actions');
                if (actionsDiv) {
                    actionsDiv.remove();
                }
            });
        }
    }
}
