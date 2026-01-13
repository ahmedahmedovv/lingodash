/**
 * Storage CRUD Operations Module
 * Handles basic Create, Read, Update, Delete operations for words
 */

import { supabase, getUserId } from '../supabase.js';

/**
 * Get all saved words for the current user
 * @returns {Array} Array of word objects
 */
export async function getSavedWords() {
    try {
        const userId = await getUserId();

        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(100000);

        if (error) {
            console.error('Error fetching words:', error);
            return [];
        }

        console.log(`Fetched ${data?.length || 0} total words from database`);

        return (data || []).map(row => ({
            word: row.word,
            definition: row.definition,
            example: row.example,
            timestamp: row.timestamp,
            interval: row.interval,
            easeFactor: row.ease_factor,
            nextReview: row.next_review,
            reviewCount: row.review_count,
            correctCount: row.correct_count,
            id: row.id
        }));
    } catch (error) {
        console.error('Error in getSavedWords:', error);
        return [];
    }
}

/**
 * Check if a word exists in Supabase and return its data
 * @param {string} word - Word to check
 * @returns {Object|null} Word data if exists, null otherwise
 */
export async function getWordIfExists(word) {
    try {
        if (!word || !word.trim()) {
            return null;
        }

        const userId = await getUserId();

        const { data: existingWords, error: fetchError } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .ilike('word', word)
            .limit(1);

        if (fetchError) {
            console.error('Error checking existing word:', fetchError);
            return null;
        }

        if (existingWords && existingWords.length > 0) {
            const existingWord = existingWords[0];
            return {
                word: existingWord.word,
                definition: existingWord.definition,
                example: existingWord.example || ''
            };
        }

        return null;
    } catch (error) {
        console.error('Error in getWordIfExists:', error);
        return null;
    }
}

/**
 * Save a word to the database
 * @param {string} word - Word to save
 * @param {string} definition - Word definition
 * @param {string} example - Example sentence
 * @returns {boolean} Success status
 */
export async function saveWord(word, definition, example = '') {
    try {
        const userId = await getUserId();

        const { data: existingWords, error: fetchError } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .ilike('word', word)
            .limit(1);

        if (fetchError) {
            console.error('Error checking existing word:', fetchError);
            throw fetchError;
        }

        if (existingWords && existingWords.length > 0) {
            const existingWord = existingWords[0];
            const { error: updateError } = await supabase
                .from('words')
                .update({
                    definition: definition,
                    example: example || existingWord.example,
                    timestamp: new Date().toISOString()
                })
                .eq('id', existingWord.id);

            if (updateError) {
                console.error('Error updating word:', updateError);
                throw updateError;
            }
        } else {
            const { error: insertError } = await supabase
                .from('words')
                .insert({
                    user_id: userId,
                    word: word,
                    definition: definition,
                    example: example || `Example sentence with "${word}" will be added here.`,
                    timestamp: new Date().toISOString(),
                    interval: 0,
                    ease_factor: 2.5,
                    next_review: new Date().toISOString(),
                    review_count: 0,
                    correct_count: 0
                });

            if (insertError) {
                console.error('Error inserting word:', insertError);
                throw insertError;
            }

            await cleanupOldWords(userId);
        }

        return true;
    } catch (error) {
        console.error('Error in saveWord:', error);
        return false;
    }
}

/**
 * Update an existing word
 * @param {string} originalWord - Original word to update
 * @param {string} newWord - New word value
 * @param {string} newDefinition - New definition
 * @param {string} newExample - New example sentence
 * @returns {boolean|Object} True on success, error object on failure
 */
export async function updateWord(originalWord, newWord, newDefinition, newExample) {
    try {
        const userId = await getUserId();

        const { data: existingWords, error: fetchError } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .ilike('word', originalWord)
            .limit(1);

        if (fetchError) {
            console.error('Error finding word to update:', fetchError);
            return false;
        }

        if (!existingWords || existingWords.length === 0) {
            console.error('Word not found:', originalWord);
            return false;
        }

        const existingWord = existingWords[0];

        if (newWord.toLowerCase() !== originalWord.toLowerCase()) {
            const { data: duplicates, error: dupError } = await supabase
                .from('words')
                .select('id')
                .eq('user_id', userId)
                .ilike('word', newWord)
                .limit(1);

            if (dupError) {
                console.error('Error checking for duplicates:', dupError);
                return false;
            }

            if (duplicates && duplicates.length > 0) {
                return { error: 'duplicate', message: 'A word with this name already exists.' };
            }
        }

        const { error: updateError } = await supabase
            .from('words')
            .update({
                word: newWord,
                definition: newDefinition,
                example: newExample,
                timestamp: new Date().toISOString()
            })
            .eq('id', existingWord.id);

        if (updateError) {
            console.error('Error updating word:', updateError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateWord:', error);
        return false;
    }
}

/**
 * Delete a word from the database
 * @param {string} word - Word to delete
 * @returns {boolean} Success status
 */
export async function deleteWord(word) {
    try {
        const userId = await getUserId();

        const { error } = await supabase
            .from('words')
            .delete()
            .eq('user_id', userId)
            .ilike('word', word);

        if (error) {
            console.error('Error deleting word:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteWord:', error);
        return false;
    }
}

/**
 * Clear all words for the current user
 * @returns {boolean} Success status
 */
export async function clearAllWords() {
    if (confirm('Are you sure you want to clear all saved words?')) {
        try {
            const userId = await getUserId();

            const { error } = await supabase
                .from('words')
                .delete()
                .eq('user_id', userId);

            if (error) {
                console.error('Error clearing words:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in clearAllWords:', error);
            return false;
        }
    }
    return false;
}

/**
 * Helper function to keep only the last 99999 words
 * @param {string} userId - User ID
 */
export async function cleanupOldWords(userId) {
    try {
        const { data: allWords, error: fetchError } = await supabase
            .from('words')
            .select('id, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

        if (fetchError || !allWords || allWords.length <= 99999) {
            return;
        }

        const wordsToDelete = allWords.slice(99999).map(w => w.id);

        if (wordsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('words')
                .delete()
                .in('id', wordsToDelete);

            if (deleteError) {
                console.error('Error cleaning up old words:', deleteError);
            }
        }
    } catch (error) {
        console.error('Error in cleanupOldWords:', error);
    }
}
