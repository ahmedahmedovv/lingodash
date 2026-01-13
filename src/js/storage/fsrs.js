/**
 * Storage FSRS Module
 * Handles FSRS (Free Spaced Repetition Scheduler) operations
 */

import { supabase, getUserId } from '../supabase.js';
import { fsrsInstance, FSRSUtils } from '../fsrs.js';
import { cleanupOldWords } from './crud.js';

/**
 * Update word review using FSRS algorithm
 * @param {string} word - Word being reviewed
 * @param {boolean} isCorrect - Whether the answer was correct
 * @param {number} responseTime - Response time in milliseconds
 * @returns {boolean} Success status
 */
export async function updateWordReviewFSRS(word, isCorrect, responseTime = null) {
    try {
        const userId = await getUserId();

        // Get the word with FSRS data
        const { data: words, error: fetchError } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .ilike('word', word)
            .limit(1);

        if (fetchError || !words || words.length === 0) {
            console.error('Word not found for FSRS review update');
            return false;
        }

        const wordData = words[0];

        // Determine FSRS rating based on correctness and response time
        const fsrsRating = fsrsInstance.determineRating(isCorrect, responseTime);

        // Calculate new FSRS values
        const fsrsResult = fsrsInstance.calculateNextReview(wordData, fsrsRating, responseTime);

        // Update word in database with FSRS values
        const { error: updateError } = await supabase
            .from('words')
            .update({
                // FSRS fields
                stability: fsrsResult.stability,
                difficulty: fsrsResult.difficulty,
                elapsed_days: fsrsResult.elapsed_days,
                scheduled_days: fsrsResult.scheduled_days,
                reps: fsrsResult.reps,
                lapses: fsrsResult.lapses,
                last_review: fsrsResult.last_review,
                next_review: fsrsResult.next_review,
                fsrs_state: fsrsResult.fsrs_state,

                // Legacy SM-2 compatibility (keep for backward compatibility)
                interval: fsrsResult.elapsed_days,
                ease_factor: 2.5, // Keep for legacy filters
                review_count: fsrsResult.reps,
                correct_count: fsrsResult.reps - fsrsResult.lapses
            })
            .eq('id', wordData.id);

        if (updateError) {
            console.error('Error updating word with FSRS:', updateError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateWordReviewFSRS:', error);
        return false;
    }
}

/**
 * Get words due for review using FSRS scheduling
 * @returns {Array} Array of words due for review
 */
export async function getWordsDueForReviewFSRS() {
    try {
        const userId = await getUserId();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .or(`next_review.is.null,next_review.lte.${now}`)
            .order('next_review', { ascending: true, nullsFirst: true });

        if (error) {
            console.error('Error fetching FSRS due words:', error);
            return [];
        }

        // Transform database fields to match the app's expected format
        return (data || []).map(row => ({
            word: row.word,
            definition: row.definition,
            example: row.example,
            timestamp: row.timestamp,
            interval: row.elapsed_days || row.interval,
            easeFactor: row.ease_factor,
            nextReview: row.next_review,
            reviewCount: row.reps || row.review_count,
            correctCount: (row.reps || row.review_count) - (row.lapses || 0),
            stability: row.stability,
            difficulty: row.difficulty,
            reps: row.reps,
            lapses: row.lapses,
            id: row.id
        }));
    } catch (error) {
        console.error('Error in getWordsDueForReviewFSRS:', error);
        return [];
    }
}

/**
 * Save word with FSRS initialization
 * @param {string} word - Word to save
 * @param {string} definition - Word definition
 * @param {string} example - Example sentence
 * @returns {boolean} Success status
 */
export async function saveWordFSRS(word, definition, example = '') {
    try {
        const userId = await getUserId();

        // Check if word already exists
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
            // Update existing word but preserve FSRS data
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
            // Add new word with FSRS initialization
            const now = new Date();
            const { error: insertError } = await supabase
                .from('words')
                .insert({
                    user_id: userId,
                    word: word,
                    definition: definition,
                    example: example || `Example sentence with "${word}" will be added here.`,
                    timestamp: now.toISOString(),
                    // FSRS initial values
                    stability: 0.0,
                    difficulty: 5.0,
                    elapsed_days: 0,
                    scheduled_days: 0,
                    reps: 0,
                    lapses: 0,
                    last_review: now,
                    next_review: now, // Due immediately for new words
                    fsrs_state: {
                        algorithm: 'fsrs',
                        version: '1.0',
                        initialized: true,
                        init_date: now.toISOString()
                    },
                    // Legacy SM-2 compatibility
                    interval: 0,
                    ease_factor: 2.5,
                    review_count: 0,
                    correct_count: 0
                });

            if (insertError) {
                console.error('Error inserting word with FSRS:', insertError);
                throw insertError;
            }

            // Clean up old words if we have more than 99999
            await cleanupOldWords(userId);
        }

        return true;
    } catch (error) {
        console.error('Error in saveWordFSRS:', error);
        return false;
    }
}

/**
 * Get saved words with FSRS-enhanced data
 * @returns {Array} Array of words with FSRS data
 */
export async function getSavedWordsFSRS() {
    try {
        const userId = await getUserId();

        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(100000);

        if (error) {
            console.error('Error fetching FSRS words:', error);
            return [];
        }

        console.log(`Fetched ${data?.length || 0} total words with FSRS data from database`);

        // Transform database fields to include FSRS data
        return (data || []).map(row => ({
            word: row.word,
            definition: row.definition,
            example: row.example,
            timestamp: row.timestamp,
            // FSRS fields
            stability: row.stability,
            difficulty: row.difficulty,
            elapsed_days: row.elapsed_days,
            scheduled_days: row.scheduled_days,
            reps: row.reps,
            lapses: row.lapses,
            last_review: row.last_review,
            fsrs_state: row.fsrs_state,
            // Legacy compatibility
            interval: row.elapsed_days || row.interval,
            easeFactor: row.ease_factor,
            nextReview: row.next_review,
            reviewCount: row.reps || row.review_count,
            correctCount: (row.reps || row.review_count) - (row.lapses || 0),
            id: row.id
        }));
    } catch (error) {
        console.error('Error in getSavedWordsFSRS:', error);
        return [];
    }
}

/**
 * Get FSRS statistics for user dashboard
 * @returns {Object} FSRS statistics
 */
export async function getFSRSStats() {
    try {
        // Use client-side calculation for immediate functionality
        console.log('Using client-side stats calculation (database optimization disabled)');
        return await getFSRSStatsFallback();
    } catch (error) {
        console.error('Error in FSRS stats:', error);
        return await getFSRSStatsFallback();
    }
}

/**
 * Fallback method for calculating FSRS stats (client-side calculation)
 * @returns {Object} FSRS statistics
 */
async function getFSRSStatsFallback() {
    try {
        const words = await getSavedWordsFSRS();

        const stats = {
            totalWords: words.length,
            newWords: words.filter(w => (w.reps || 0) === 0).length,
            learningWords: words.filter(w => (w.reps || 0) > 0 && (w.stability || 0) < 7).length,
            masteredWords: words.filter(w => (w.stability || 0) >= 21).length,
            dueWords: words.filter(w => FSRSUtils.isDueForReview(w)).length,
            averageStability: words.length > 0 ?
                words.reduce((sum, w) => sum + (w.stability || 0), 0) / words.length : 0,
            averageDifficulty: words.length > 0 ?
                words.reduce((sum, w) => sum + (w.difficulty || 5), 0) / words.length : 0,
            totalReviews: words.reduce((sum, w) => sum + (w.reps || 0), 0),
            totalLapses: words.reduce((sum, w) => sum + (w.lapses || 0), 0)
        };

        return stats;
    } catch (error) {
        console.error('Error calculating FSRS stats fallback:', error);
        return {
            totalWords: 0,
            newWords: 0,
            learningWords: 0,
            masteredWords: 0,
            dueWords: 0,
            averageStability: 0,
            averageDifficulty: 5.0,
            totalReviews: 0,
            totalLapses: 0
        };
    }
}
