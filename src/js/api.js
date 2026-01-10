import { MISTRAL_API_KEY, MISTRAL_API_URL } from './config.js';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds before retry

// Helper function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getWordDefinition(word, retryCount = 0) {
    if (!word.trim()) {
        return null;
    }

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [{
                    role: 'user',
                    content: `For the word "${word}":
1. Provide a brief, clear definition (1-2 sentences).
2. Provide one simple example sentence using the word. Don't give me any additional information.

IMPORTANT RULES:
- DO NOT use the word "${word}" or any variation of it in the definition itself
- The definition should describe the meaning WITHOUT mentioning the word
- The example sentence should use the word "${word}" naturally
- Keep the definition clear enough that someone could guess the word from it

Format your response as:
Definition: [definition here - WITHOUT using the word "${word}"]
Example: [example sentence using "${word}"]

If it's not a valid word, say so briefly.`
                }],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse definition and example
        let definition = content;
        let example = '';
        
        if (content.includes('Definition:') && content.includes('Example:')) {
            const parts = content.split('Example:');
            definition = parts[0].replace('Definition:', '').trim();
            example = parts[1].trim();
        }

        return { word, definition, example };
    } catch (error) {
        console.error('Error fetching definition:', error);
        let errorMessage = error.message;
        
        // Handle rate limiting with retry
        if ((error.message.includes('429') || error.message.includes('Rate limit')) && retryCount < MAX_RETRIES) {
            console.log(`Rate limit hit for "${word}". Retrying in ${RETRY_DELAY}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return getWordDefinition(word, retryCount + 1);
        }
        
        if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'API authentication failed. Please check your API key.';
        } else if (error.message.includes('429') || error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please wait or upgrade your plan.';
        }
        throw new Error(errorMessage);
    }
}

export async function getBatchWordDefinitions(words, progressCallback = null, onWordCompleteCallback = null) {
    // Filter out empty words and remove duplicates
    const uniqueWords = [...new Set(words.filter(w => w.trim()))];
    
    if (uniqueWords.length === 0) {
        return [];
    }

    // Process words sequentially with delay to avoid rate limiting
    const results = [];
    
    for (let i = 0; i < uniqueWords.length; i++) {
        const word = uniqueWords[i];
        
        // Update progress if callback provided
        if (progressCallback) {
            progressCallback(i + 1, uniqueWords.length, word);
        }
        
        try {
            const result = await getWordDefinition(word);
            const successResult = { ...result, success: true };
            results.push(successResult);
            
            // Notify that word is complete (for auto-save)
            if (onWordCompleteCallback) {
                onWordCompleteCallback(successResult);
            }
        } catch (error) {
            const errorResult = { 
                word, 
                error: error.message, 
                success: false 
            };
            results.push(errorResult);
            
            // Notify about error too
            if (onWordCompleteCallback) {
                onWordCompleteCallback(errorResult);
            }
        }
        
        // Add delay between requests (except after the last one)
        if (i < uniqueWords.length - 1) {
            await delay(RATE_LIMIT_DELAY);
        }
    }

    return results;
}
