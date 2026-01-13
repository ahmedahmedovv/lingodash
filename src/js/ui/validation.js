/**
 * UI Validation Module
 * Handles input validation utilities
 */

/**
 * Validate that a word appears in its example sentence
 * @param {string} word - Word to validate
 * @param {string} example - Example sentence
 * @returns {Object} Validation result with valid flag and error message
 */
export function validateWordExample(word, example) {
    if (!word || !word.trim()) {
        return { valid: false, error: "Word is required" };
    }

    if (!example || !example.trim()) {
        return { valid: false, error: "Example sentence is required" };
    }

    // Case-insensitive check for the word (word boundaries to avoid partial matches)
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    const wordFound = regex.test(example);

    if (!wordFound) {
        return {
            valid: false,
            error: `The word "${word}" must appear in the example sentence`
        };
    }

    return { valid: true };
}

/**
 * Check if a word appears in text
 * @param {string} text - Text to search in
 * @param {string} targetWord - Word to find
 * @returns {boolean} True if word is found
 */
export function containsWord(text, targetWord) {
    console.log('🔍 Word Validation: Checking if', targetWord, 'appears in:', text);

    if (!text || !targetWord) {
        console.log('🔍 Word Validation: Missing parameters');
        return false;
    }

    // Case-insensitive check for the word (word boundaries to avoid partial matches)
    const regex = new RegExp(`\\b${escapeRegex(targetWord)}\\b`, 'i');
    const result = regex.test(text);
    console.log('🔍 Word Validation: Regex test result:', result);

    return result;
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for regex
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with valid flag and message
 */
export function validatePassword(password) {
    if (!password || password.length < 6) {
        return {
            valid: false,
            error: 'Password must be at least 6 characters long'
        };
    }

    return { valid: true };
}
