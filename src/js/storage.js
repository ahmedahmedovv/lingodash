// Supabase storage functions
import { supabase, getUserId } from './supabase.js';
import { fsrsInstance, FSRS_RATING, FSRSUtils } from './fsrs.js';

export async function getSavedWords() {
    try {
        const userId = await getUserId();

        // Use a very high limit to get all records (works in both browser and test environments)
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(100000); // Very high limit to get all records

        if (error) {
            console.error('Error fetching words:', error);
            return [];
        }

        console.log(`Fetched ${data?.length || 0} total words from database`);

        // Transform database fields to match the app's expected format
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
            id: row.id // Keep the database ID for updates
        }));
    } catch (error) {
        console.error('Error in getSavedWords:', error);
        return [];
    }
}

// Get saved words with pagination and optional filter
export async function getSavedWordsPaginated(page = 1, pageSize = 50, filter = 'all') {
    try {
        const userId = await getUserId();
        const offset = (page - 1) * pageSize;
        const now = new Date().toISOString();

        // Build base query for count
        let countQuery = supabase
            .from('words')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Apply filter conditions to count query
        switch (filter) {
            case 'new':
                countQuery = countQuery.eq('review_count', 0);
                break;
            case 'learning':
                countQuery = countQuery.gt('review_count', 0).lt('interval', 10);
                break;
            case 'mastered':
                countQuery = countQuery.gte('interval', 30);
                break;
            case 'due':
                countQuery = countQuery.lte('next_review', now);
                break;
        }

        // Build data query
        let dataQuery = supabase
            .from('words')
            .select('*')
            .eq('user_id', userId);

        // Apply filter conditions to data query
        switch (filter) {
            case 'new':
                dataQuery = dataQuery.eq('review_count', 0);
                break;
            case 'learning':
                dataQuery = dataQuery.gt('review_count', 0).lt('interval', 10);
                break;
            case 'mastered':
                dataQuery = dataQuery.gte('interval', 30);
                break;
            case 'due':
                dataQuery = dataQuery.lte('next_review', now);
                break;
        }

        // Run both queries in parallel to reduce loading time
        const [countResult, dataResult] = await Promise.all([
            countQuery,
            dataQuery.order('timestamp', { ascending: false }).limit(pageSize)
        ]);

        const { count, error: countError } = countResult;
        const { data, error } = dataResult;

        if (countError) {
            console.error('Error fetching word count:', countError);
            return { words: [], totalCount: 0, totalPages: 0, currentPage: 1 };
        }

        if (error) {
            console.error('Error fetching words:', error);
            return { words: [], totalCount: 0, totalPages: 0, currentPage: 1 };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // Transform database fields to match the app's expected format
        const words = (data || []).map(row => ({
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

        return {
            words,
            totalCount,
            totalPages,
            currentPage: page
        };
    } catch (error) {
        console.error('Error in getSavedWordsPaginated:', error);
        return { words: [], totalCount: 0, totalPages: 0, currentPage: 1 };
    }
}

// Check if a word exists in Supabase and return its data
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
            // Return in the same format as AI API response
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

export async function saveWord(word, definition, example = '') {
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
            // Update existing word but preserve spaced repetition data
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
            // Add new word with initial spaced repetition data
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
            
            // Clean up old words if we have more than 99999
            await cleanupOldWords(userId);
        }
        
        return true;
    } catch (error) {
        console.error('Error in saveWord:', error);
        return false;
    }
}

// Helper function to keep only the last 99999 words
async function cleanupOldWords(userId) {
    try {
        const { data: allWords, error: fetchError } = await supabase
            .from('words')
            .select('id, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

        if (fetchError || !allWords || allWords.length <= 99999) {
            return;
        }

        // Delete words beyond the 99999th
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

// Update spaced repetition data after reviewing a word
export async function updateWordReview(word, isCorrect) {
    try {
        const userId = await getUserId();
        
        // Get the word
        const { data: words, error: fetchError } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .ilike('word', word)
            .limit(1);
        
        if (fetchError || !words || words.length === 0) {
            console.error('Word not found for review update');
            return false;
        }
        
        const wordData = words[0];
        
        // Initialize spaced repetition data if missing (for backwards compatibility)
        let interval = wordData.interval !== null ? wordData.interval : 0;
        let easeFactor = wordData.ease_factor !== null ? wordData.ease_factor : 2.5;
        let reviewCount = wordData.review_count !== null ? wordData.review_count : 0;
        let correctCount = wordData.correct_count !== null ? wordData.correct_count : 0;
        
        reviewCount += 1;
        
        if (isCorrect) {
            correctCount += 1;
            
            // Increase interval based on current level
            if (interval === 0) {
                interval = 1; // First correct: review tomorrow
            } else if (interval === 1) {
                interval = 3; // Second correct: review in 3 days
            } else {
                // Subsequent correct answers: multiply by ease factor
                interval = Math.round(interval * easeFactor);
            }
            
            // Cap interval at 365 days (1 year)
            interval = Math.min(interval, 365);
            
            // Increase ease factor slightly for consistent success
            easeFactor = Math.min(easeFactor + 0.1, 3.0);
        } else {
            // Incorrect answer: reset to short interval
            interval = 0; // Review again in this session
            
            // Decrease ease factor for struggled words
            easeFactor = Math.max(easeFactor - 0.2, 1.3);
        }
        
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        
        // Update in database
        const { error: updateError } = await supabase
            .from('words')
            .update({
                interval: interval,
                ease_factor: easeFactor,
                next_review: nextReviewDate.toISOString(),
                review_count: reviewCount,
                correct_count: correctCount
            })
            .eq('id', wordData.id);
        
        if (updateError) {
            console.error('Error updating word review:', updateError);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error in updateWordReview:', error);
        return false;
    }
}

// Get words that are due for review
export async function getWordsDueForReview() {
    try {
        const userId = await getUserId();
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .lte('next_review', now)
            .order('next_review', { ascending: true });
        
        if (error) {
            console.error('Error fetching due words:', error);
            return [];
        }
        
        // Transform database fields to match the app's expected format
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
        console.error('Error in getWordsDueForReview:', error);
        return [];
    }
}

export async function updateWord(originalWord, newWord, newDefinition, newExample) {
    try {
        const userId = await getUserId();

        // Find the existing word
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

        // If word name changed, check for duplicates
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

        // Update the word
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

// Export words in different formats
export async function exportWords(format = 'json') {
    const words = await getSavedWords();

    if (words.length === 0) {
        alert('No words to export!');
        return;
    }

    let content, filename, mimeType;

    if (format === 'csv') {
        // CSV format
        const headers = ['Word', 'Definition', 'Example', 'Date Added', 'Review Count', 'Correct Count', 'Next Review', 'Interval (days)', 'Stability', 'Difficulty'];
        const csvRows = [headers.join(',')];

        words.forEach(word => {
            const row = [
                `"${word.word}"`,
                `"${word.definition.replace(/"/g, '""')}"`,
                `"${(word.example || '').replace(/"/g, '""')}"`,
                `"${new Date(word.timestamp).toLocaleDateString()}"`,
                word.reviewCount || 0,
                word.correctCount || 0,
                word.nextReview ? `"${new Date(word.nextReview).toLocaleDateString()}"` : '""',
                word.interval || 0,
                word.stability || 0,
                word.difficulty || 5.0
            ];
            csvRows.push(row.join(','));
        });

        content = csvRows.join('\n');
        filename = `lingodash-vocabulary-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
    } else {
        // JSON format (default)
        content = JSON.stringify(words, null, 2);
        filename = `lingodash-vocabulary-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
    }

    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// =============================
// FSRS (Free Spaced Repetition Scheduler) Functions
// =============================

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
 * Get FSRS statistics for user dashboard (optimized version)
 * @returns {Object} FSRS statistics
 */
export async function getFSRSStats() {
    try {
        // Temporarily use client-side calculation for immediate functionality
        // Database optimization can be re-enabled later
        console.log('Using client-side stats calculation (database optimization disabled)');
        return await getFSRSStatsFallback();

        /* Re-enable optimized query later when database function issues are resolved
        const userId = await getUserId();
        const now = new Date().toISOString();

        // Use database aggregation for better performance
        const { data, error } = await supabase
            .rpc('get_fsrs_stats_fast', {
                user_uuid: userId,
                review_cutoff: now
            });

        if (error) {
            console.warn('Optimized stats query failed, falling back to client-side calculation:', error);
            // Fallback to original method if RPC fails
            return await getFSRSStatsFallback();
        }

        // Transform the aggregated data
        const stats = data[0] || {};

        return {
            totalWords: parseInt(stats.total_words) || 0,
            newWords: parseInt(stats.new_words) || 0,
            learningWords: parseInt(stats.learning_words) || 0,
            masteredWords: parseInt(stats.mastered_words) || 0,
            dueWords: parseInt(stats.due_words) || 0,
            averageStability: parseFloat(stats.avg_stability) || 0,
            averageDifficulty: parseFloat(stats.avg_difficulty) || 5.0,
            totalReviews: parseInt(stats.total_reviews) || 0,
            totalLapses: parseInt(stats.total_lapses) || 0
        };
        */

    } catch (error) {
        console.error('Error in FSRS stats:', error);
        return await getFSRSStatsFallback();
    }
}

/**
 * Fallback method for calculating FSRS stats (original client-side method)
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
