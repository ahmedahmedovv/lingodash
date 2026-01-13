/**
 * Storage Pagination Module
 * Handles paginated word queries with filtering
 */

import { supabase, getUserId } from '../supabase.js';

/**
 * Get saved words with pagination and optional filter
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @param {string} filter - Filter type ('all', 'new', 'learning', 'mastered', 'due')
 * @returns {Object} Paginated result with words, totalCount, totalPages, currentPage
 */
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
        countQuery = applyFilterToQuery(countQuery, filter, now);

        // Build data query
        let dataQuery = supabase
            .from('words')
            .select('*')
            .eq('user_id', userId);

        // Apply filter conditions to data query
        dataQuery = applyFilterToQuery(dataQuery, filter, now);

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

/**
 * Apply filter conditions to a Supabase query
 * @param {Object} query - Supabase query builder
 * @param {string} filter - Filter type
 * @param {string} now - Current ISO timestamp
 * @returns {Object} Modified query
 */
function applyFilterToQuery(query, filter, now) {
    switch (filter) {
        case 'new':
            return query.eq('review_count', 0);
        case 'learning':
            return query.gt('review_count', 0).lt('interval', 10);
        case 'mastered':
            return query.gte('interval', 30);
        case 'due':
            return query.lte('next_review', now);
        default:
            return query;
    }
}
