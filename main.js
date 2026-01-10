const MISTRAL_API_KEY = 'UyFZtjZY3r5aNe1th2qtx6IBLynCc0ai';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const textInput = document.getElementById('textInput');
const definitionBox = document.getElementById('definitionBox');
const definitionContent = document.getElementById('definitionContent');

let debounceTimeout;

async function getWordDefinition(word) {
    if (!word.trim()) {
        definitionBox.classList.remove('visible');
        return;
    }

    // Show loading state
    definitionBox.classList.add('visible');
    definitionContent.innerHTML = '<p class="loading">Looking up definition...</p>';

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [{
                    role: 'user',
                    content: `Provide a brief, clear definition of the word "${word}". Keep it concise (2-3 sentences maximum). If it's not a valid word, say so briefly.`
                }],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const definition = data.choices[0].message.content;

        definitionContent.innerHTML = `
            <h3>${word}</h3>
            <p>${definition}</p>
        `;
    } catch (error) {
        console.error('Error fetching definition:', error);
        let errorMessage = error.message;
        if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'API authentication failed. Please check your API key.';
        } else if (error.message.includes('429') || error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please wait or upgrade your plan.';
        }
        definitionContent.innerHTML = `
            <p class="error">${errorMessage}</p>
        `;
    }
}

textInput.addEventListener('input', (e) => {
    const word = e.target.value.trim();
    
    // Clear existing timeout
    clearTimeout(debounceTimeout);
    
    // Set new timeout to avoid too many API calls
    debounceTimeout = setTimeout(() => {
        if (word) {
            getWordDefinition(word);
        } else {
            definitionBox.classList.remove('visible');
        }
    }, 800); // Wait 800ms after user stops typing
});

// Also trigger on Enter key
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(debounceTimeout);
        getWordDefinition(e.target.value.trim());
    }
});
