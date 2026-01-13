import { getWordDefinition, getBatchWordDefinitions } from './api.js';
import { saveWord } from './storage/index.js';
import { displaySavedWords, validateWordExample } from './ui/index.js';

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

        const isAlreadySaved = result.fromSupabase;
        const saveButtonText = isAlreadySaved ? '✓ Already Saved (Update)' : '💾 Save Word';
        let sourceIndicator = '';

        if (isAlreadySaved) {
            sourceIndicator = '<p style="color: #3498db; font-size: 0.9em; margin-top: 8px;">✓ This word is already in your collection</p>';
        } else if (result.potentiallyInvalid) {
            sourceIndicator = '<p style="color: #f39c12; font-size: 0.9em; margin-top: 8px;">⚠️ AI example may need review</p>';
        } else {
            sourceIndicator = '<p style="color: #27ae60; font-size: 0.9em; margin-top: 8px;">🆕 New word fetched from AI</p>';
        }

        definitionContent.innerHTML = `
            <h3>${result.word}</h3>
            <p><strong>Definition:</strong> ${result.definition}</p>
            ${result.example ? `<p class="example-text"><strong>Example:</strong> ${result.example}</p>` : ''}
            ${sourceIndicator}
            <button class="save-btn" id="saveWordBtn" ${isAlreadySaved ? 'style="background: #3498db;"' : ''}>${saveButtonText}</button>
        `;
        
        // Add event listener for save button
        const saveBtn = document.getElementById('saveWordBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                // Validate that the word appears in the example
                const validation = validateWordExample(result.word, result.example);
                if (!validation.valid) {
                    // Show validation error
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = `
                        color: #A0522D;
                        background: #FDF0E6;
                        border: 1px solid #A0522D;
                        border-radius: 4px;
                        padding: 8px 12px;
                        margin-top: 8px;
                        font-size: 0.9em;
                    `;
                    errorDiv.textContent = validation.error;

                    // Remove any existing error message
                    const existingError = definitionContent.querySelector('.validation-error');
                    if (existingError) {
                        existingError.remove();
                    }

                    // Add the error message
                    definitionContent.appendChild(errorDiv);
                    errorDiv.classList.add('validation-error');

                    // Focus on the error and scroll to it
                    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    return;
                }

                // Remove any existing validation errors
                const existingError = definitionContent.querySelector('.validation-error');
                if (existingError) {
                    existingError.remove();
                }

                // Save word to Supabase (async operation)
                saveBtn.innerHTML = '💾 Saving...';
                saveBtn.disabled = true;

                const success = await saveWord(result.word, result.definition, result.example);

                if (success) {
                    // Only update the UI if user is on the saved words tab
                    // This prevents unnecessary DOM manipulation when user is on lookup tab
                    const savedWordsPanel = document.getElementById('saved-panel');
                    if (savedWordsPanel && savedWordsPanel.classList.contains('active')) {
                        await displaySavedWords();
                    }

                    // Provide immediate visual feedback
                    saveBtn.innerHTML = '✓ Saved!';
                    saveBtn.style.background = '#27ae60';

                    setTimeout(() => {
                        saveBtn.innerHTML = '💾 Save Word';
                        saveBtn.style.background = '';
                        saveBtn.disabled = false;
                    }, 2000);
                } else {
                    // Handle save error
                    saveBtn.innerHTML = '❌ Error';
                    saveBtn.style.background = '#e74c3c';

                    setTimeout(() => {
                        saveBtn.innerHTML = '💾 Save Word';
                        saveBtn.style.background = '';
                        saveBtn.disabled = false;
                    }, 2000);
                }
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
    
    let savedCount = 0;
    
    try {
        // Fetch all definitions with rate limiting, progress updates, and auto-save
        const results = await getBatchWordDefinitions(
            words, 
            // Progress callback
            (current, total, currentWord, source) => {
                if (source === 'checking') {
                    batchProgress.textContent = `Checking word ${current}/${total}: "${currentWord}"... (${savedCount} saved)`;
                } else if (source === 'reusing') {
                    batchProgress.textContent = `Reusing "${currentWord}" from collection (${current}/${total})... (${savedCount} saved)`;
                } else if (source === 'fetching') {
                    batchProgress.textContent = `Fetching "${currentWord}" from AI (${current}/${total})... (${savedCount} saved)`;
                } else {
                    batchProgress.textContent = `Looking up word ${current}/${total}: "${currentWord}"... (${savedCount} saved)`;
                }
            },
            // Auto-save callback - saves each word as it's looked up (only if not already in Supabase)
            async (result) => {
                if (result.success) {
                    // Only save if word wasn't already in Supabase
                    // (saveWord handles duplicates, but we can skip the call if already from Supabase)
                    if (!result.fromSupabase) {
                        const success = await saveWord(result.word, result.definition, result.example);
                        if (success) {
                            savedCount++;
                            
                            // Update saved words tab if visible
                            const savedWordsPanel = document.getElementById('saved-panel');
                            if (savedWordsPanel && savedWordsPanel.classList.contains('active')) {
                                await displaySavedWords();
                            }
                        }
                    } else {
                        // Word already exists in Supabase, count it as already saved
                        savedCount++;
                    }
                }
            }
        );
        batchResults = results;
        
        // Hide progress
        batchProgress.style.display = 'none';
        batchLookupBtn.disabled = false;
        
        // Display results
        displayBatchResults(results, savedCount);
        
    } catch (error) {
        batchProgress.textContent = `Error: ${error.message}`;
        batchProgress.style.color = '#e74c3c';
        batchLookupBtn.disabled = false;
    }
}

function displayBatchResults(results, alreadySavedCount = 0) {
    const batchResultsDiv = document.getElementById('batchResults');
    
    if (results.length === 0) {
        batchResultsDiv.innerHTML = '<p class="empty-state">No results to display.</p>';
        return;
    }
    
    // Display results - successful words are already auto-saved
    batchResultsDiv.innerHTML = results.map((result, index) => {
        if (result.success) {
            const isReused = result.fromSupabase;
            const statusBadge = isReused 
                ? '<span class="word-source-badge" style="background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 8px;">✓ From Collection</span>'
                : '<span class="word-source-badge" style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 8px;">🆕 New</span>';
            const saveButtonText = isReused ? '✓ Already Saved' : '✓ Auto-Saved';
            
            return `
                <div class="batch-result-card" data-index="${index}">
                    <div class="batch-result-header">
                        <h4>${result.word}${statusBadge}</h4>
                        <button class="save-btn batch-save-btn" data-index="${index}" disabled style="background: #27ae60;">${saveButtonText}</button>
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
    const reusedCount = results.filter(r => r.success && r.fromSupabase).length;
    const newCount = results.filter(r => r.success && !r.fromSupabase).length;
    
    if (successCount > 0) {
        let summaryMessage = '';
        if (reusedCount > 0 && newCount > 0) {
            summaryMessage = `✅ ${newCount} new word${newCount > 1 ? 's' : ''} saved, ${reusedCount} word${reusedCount > 1 ? 's' : ''} reused from collection`;
        } else if (reusedCount > 0) {
            summaryMessage = `✅ ${reusedCount} word${reusedCount > 1 ? 's' : ''} reused from your collection`;
        } else {
            summaryMessage = `✅ ${newCount} word${newCount > 1 ? 's' : ''} auto-saved to your collection`;
        }
        
        const actionsHtml = `
            <div class="batch-actions">
                <p class="auto-save-notice">${summaryMessage}</p>
                <button id="batchClearBtn" class="batch-clear-btn">Clear Results</button>
            </div>
        `;
        batchResultsDiv.insertAdjacentHTML('afterend', actionsHtml);
        
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
