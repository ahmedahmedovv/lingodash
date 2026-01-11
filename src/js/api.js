import { MISTRAL_API_KEY, MISTRAL_API_URL } from './config.js';
import { getWordIfExists } from './storage.js';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds before retry

// Helper function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to check if word appears in example
function containsWord(example, targetWord) {
    if (!example || !targetWord) {
        return false;
    }

    // Case-insensitive check for the word (word boundaries to avoid partial matches)
    const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
    return regex.test(example);
}

export async function getWordDefinition(word, retryCount = 0) {
    if (!word.trim()) {
        return null;
    }

    // Check Supabase first (only on first call, not retries)
    if (retryCount === 0) {
        const existingWord = await getWordIfExists(word);
        if (existingWord) {
            return { ...existingWord, fromSupabase: true };
        }
    }

    // For AI generation, try up to 3 times to get a valid example
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`🤖 AI generation attempt ${attempts}/${maxAttempts} for "${word}"`);

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
                        content: attempts === 1
                            ? `For the word "${word}":
1. Provide a brief, clear definition (1-2 sentences).
2. Provide one simple example sentence using the word. Don't give me any additional information.

CRITICAL REQUIREMENTS:
- DO NOT use the word "${word}" or any variation of it in the definition itself
- The definition should describe the meaning WITHOUT mentioning the word
- The example sentence MUST use the EXACT word "${word}" (not plural, not past tense, not any variation)
- The example sentence must be grammatically correct and natural
- Keep the definition clear enough that someone could guess the word from it

EXAMPLES:
- For word "run": "She decided to run in the park every morning."
- For word "happy": "The child was happy with his new toy."
- For word "book": "I enjoy reading a book before bed."

Format your response as:
Definition: [definition here - WITHOUT using the word "${word}"]
Example: [example sentence using EXACTLY "${word}"]

If it's not a valid word, say so briefly.`
                            : `CRITICAL FIX NEEDED: The previous example did not contain the exact word "${word}". Try again:

For the word "${word}":
1. Provide a brief, clear definition (1-2 sentences).
2. Provide one simple example sentence using the word. Don't give me any additional information.

FORCED REQUIREMENTS:
- The example sentence MUST contain the EXACT word "${word}" (check spelling!)
- Do NOT use plurals, past tense, or other variations
- Example must be natural and grammatically correct

Format your response as:
Definition: [definition here - WITHOUT using the word "${word}"]
Example: [example sentence using EXACTLY "${word}"]`
                    }],
                    temperature: attempts > 1 ? 0.3 : 0.7, // Lower temperature on retries for consistency
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

            // Validate the generated example
            const isValidExample = containsWord(example, word);

            if (isValidExample) {
                console.log(`✅ Valid AI example generated on attempt ${attempts}: "${example}"`);
                return { word, definition, example, fromSupabase: false };
            } else {
                console.log(`⚠️ Invalid AI example (attempt ${attempts}): "${example}"`);

                if (attempts < maxAttempts) {
                    console.log(`🔄 Retrying with stricter prompt for "${word}"...`);
                    // Brief pause before retry
                    await delay(300);
                    continue;
                } else {
                    console.log(`❌ Failed to generate valid example after ${maxAttempts} attempts`);
                    // Return the last attempt anyway, but mark it as potentially invalid
                    return { word, definition, example, fromSupabase: false, potentiallyInvalid: true };
                }
            }

        } catch (error) {
            console.error(`Error on attempt ${attempts} for "${word}":`, error);
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

            // If this is the last attempt, throw the error
            if (attempts >= maxAttempts) {
                throw new Error(errorMessage);
            }

            // Otherwise, continue to next attempt
        }
    }

    // This should never be reached, but just in case
    throw new Error(`Failed to generate definition for "${word}" after ${maxAttempts} attempts`);
}

export async function regenerateWordExample(word, retryCount = 0) {
    if (!word.trim()) {
        return null;
    }

    // For regeneration, try up to 3 times to get a valid example
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Regeneration attempt ${attempts}/${maxAttempts} for "${word}"`);

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
                        content: attempts === 1
                            ? `For the word "${word}":
1. Provide a brief, clear definition (1-2 sentences).
2. Provide one simple example sentence using the word. Don't give me any additional information.

CRITICAL REQUIREMENTS FOR REGENERATION:
- DO NOT use the word "${word}" or any variation of it in the definition itself
- The definition should describe the meaning WITHOUT mentioning the word
- The example sentence MUST use the EXACT word "${word}" (not plural, not past tense, not any variation)
- The example sentence must be grammatically correct and natural
- This is for regenerating examples - the example MUST contain the exact word "${word}"

FORCED EXAMPLES:
- For word "run": "She decided to run in the park every morning."
- For word "happy": "The child was happy with his new toy."
- For word "book": "I enjoy reading a book before bed."

Format your response as:
Definition: [definition here - WITHOUT using the word "${word}"]
Example: [example sentence using EXACTLY "${word}"]

If it's not a valid word, say so briefly.`
                            : `CRITICAL FIX NEEDED: The previous regeneration did not contain the exact word "${word}". Try again:

For the word "${word}":
1. Provide a brief, clear definition (1-2 sentences).
2. Provide one simple example sentence using the word. Don't give me any additional information.

FORCED REGENERATION REQUIREMENTS:
- The example sentence MUST contain the EXACT word "${word}" (check spelling!)
- Do NOT use plurals, past tense, or other variations
- Example must be natural and grammatically correct
- This is a regeneration - ensure the example contains "${word}"

Format your response as:
Definition: [definition here - WITHOUT using the word "${word}"]
Example: [example sentence using EXACTLY "${word}"]`
                    }],
                    temperature: attempts > 1 ? 0.3 : 0.7, // Lower temperature on retries for consistency
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

            // Validate the generated example
            const isValidExample = containsWord(example, word);

            if (isValidExample) {
                console.log(`✅ Valid regeneration generated on attempt ${attempts}: "${example}"`);
                return { word, definition, example, fromSupabase: false };
            } else {
                console.log(`⚠️ Invalid regeneration (attempt ${attempts}): "${example}"`);

                if (attempts < maxAttempts) {
                    console.log(`🔄 Retrying regeneration with stricter prompt for "${word}"...`);
                    // Brief pause before retry
                    await delay(300);
                    continue;
                } else {
                    console.log(`❌ Failed to regenerate valid example after ${maxAttempts} attempts`);
                    // Return the last attempt anyway, but mark it as potentially invalid
                    return { word, definition, example, fromSupabase: false, potentiallyInvalid: true };
                }
            }

        } catch (error) {
            console.error(`Error on regeneration attempt ${attempts} for "${word}":`, error);
            let errorMessage = error.message;

            // Handle rate limiting with retry
            if ((error.message.includes('429') || error.message.includes('Rate limit')) && retryCount < MAX_RETRIES) {
                console.log(`Rate limit hit for regeneration of "${word}". Retrying in ${RETRY_DELAY}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
                return regenerateWordExample(word, retryCount + 1);
            }

            if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'API authentication failed. Please check your API key.';
            } else if (error.message.includes('429') || error.message.includes('quota')) {
                errorMessage = 'API quota exceeded. Please wait or upgrade your plan.';
            }

            // If this is the last attempt, throw the error
            if (attempts >= maxAttempts) {
                throw new Error(errorMessage);
            }

            // Otherwise, continue to next attempt
        }
    }

    // This should never be reached, but just in case
    throw new Error(`Failed to regenerate example for "${word}" after ${maxAttempts} attempts`);
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
        
        // Check Supabase first for better progress feedback
        if (progressCallback) {
            progressCallback(i + 1, uniqueWords.length, word, 'checking');
        }
        
        const existingWord = await getWordIfExists(word);
        let result;
        
        if (existingWord) {
            // Word exists in Supabase, reuse it
            if (progressCallback) {
                progressCallback(i + 1, uniqueWords.length, word, 'reusing');
            }
            result = existingWord;
        } else {
            // Word doesn't exist, fetch from AI
            if (progressCallback) {
                progressCallback(i + 1, uniqueWords.length, word, 'fetching');
            }
            
            try {
                result = await getWordDefinition(word);
            } catch (error) {
                const errorResult = { 
                    word, 
                    error: error.message, 
                    success: false 
                };
                results.push(errorResult);
                
                // Notify about error
                if (onWordCompleteCallback) {
                    onWordCompleteCallback(errorResult);
                }
                
                // Add delay before next word (even on error)
                if (i < uniqueWords.length - 1) {
                    await delay(RATE_LIMIT_DELAY);
                }
                continue;
            }
            
            // Add delay between AI API requests (except after the last one)
            if (i < uniqueWords.length - 1) {
                await delay(RATE_LIMIT_DELAY);
            }
        }
        
        const successResult = { ...result, success: true, fromSupabase: !!existingWord };
        results.push(successResult);
        
        // Notify that word is complete (for auto-save)
        if (onWordCompleteCallback) {
            onWordCompleteCallback(successResult);
        }
    }

    return results;
}
