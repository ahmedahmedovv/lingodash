import { getWordDefinition } from './api.js';
import { saveWord } from './storage.js';
import { displaySavedWords } from './ui.js';

const definitionBox = document.getElementById('definitionBox');
const definitionContent = document.getElementById('definitionContent');

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
                saveWord(result.word, result.definition, result.example);
                displaySavedWords();
                
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
