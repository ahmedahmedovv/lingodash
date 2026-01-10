import { MISTRAL_API_KEY, MISTRAL_API_URL } from './config.js';

export async function getWordDefinition(word) {
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
                model: 'mistral-tiny',
                messages: [{
                    role: 'user',
                    content: `For the word "${word}":
1. Provide a brief, clear definition (1-2 sentences).
2. Provide one simple example sentence using the word.

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
        if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'API authentication failed. Please check your API key.';
        } else if (error.message.includes('429') || error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please wait or upgrade your plan.';
        }
        throw new Error(errorMessage);
    }
}
