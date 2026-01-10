// Supabase storage functions
import { supabase, getUserId } from './supabase.js';

export async function getSavedWords() {
    try {
        const userId = await getUserId();
        
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Error fetching words:', error);
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
            id: row.id // Keep the database ID for updates
        }));
    } catch (error) {
        console.error('Error in getSavedWords:', error);
        return [];
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
            
            // Clean up old words if we have more than 50
            await cleanupOldWords(userId);
        }
        
        return true;
    } catch (error) {
        console.error('Error in saveWord:', error);
        return false;
    }
}

// Helper function to keep only the last 50 words
async function cleanupOldWords(userId) {
    try {
        const { data: allWords, error: fetchError } = await supabase
            .from('words')
            .select('id, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
        
        if (fetchError || !allWords || allWords.length <= 50) {
            return;
        }
        
        // Delete words beyond the 50th
        const wordsToDelete = allWords.slice(50).map(w => w.id);
        
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
        const headers = ['Word', 'Definition', 'Example', 'Date Added', 'Review Count', 'Correct Count', 'Next Review', 'Interval (days)'];
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
                word.interval || 0
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
