/**
 * Exercise Session Module
 * Handles session management, caching, and preferences
 */

import { getSavedWords, getWordsDueForReview } from '../storage/index.js';

// Exercise data cache for instant loading
let exerciseDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Session size preference management
const SESSION_SIZE_KEY = 'lingodash_session_size';
const DEFAULT_SESSION_SIZE = 25;

/**
 * Pre-fetch exercise data when app initializes
 */
export async function prefetchExerciseData() {
    try {
        const [savedWords, dueWords] = await Promise.all([
            getSavedWords(),
            getWordsDueForReview()
        ]);

        exerciseDataCache = { savedWords, dueWords };
        cacheTimestamp = Date.now();
    } catch (error) {
        console.error('Failed to pre-fetch exercise data:', error);
    }
}

/**
 * Check if cached data is still valid
 * @returns {boolean} True if cache is valid
 */
export function isCacheValid() {
    return exerciseDataCache && cacheTimestamp &&
           (Date.now() - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Get cached exercise data
 * @returns {Object|null} Cached data or null
 */
export function getCachedData() {
    return exerciseDataCache;
}

/**
 * Update the exercise data cache
 * @param {Object} data - Data to cache
 */
export function updateCache(data) {
    exerciseDataCache = data;
    cacheTimestamp = Date.now();
}

/**
 * Get the current session size preference
 * @returns {number} Session size (25 or 50)
 */
export function getSessionSize() {
    const saved = localStorage.getItem(SESSION_SIZE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SESSION_SIZE;
}

/**
 * Set the session size preference
 * @param {number} size - Session size to save
 */
export function setSessionSize(size) {
    localStorage.setItem(SESSION_SIZE_KEY, size.toString());
}

/**
 * Select words for an exercise session
 * @param {Array} savedWords - All saved words
 * @param {Array} dueWords - Words due for review
 * @param {number} sessionSize - Maximum session size
 * @returns {Array} Selected words for the session
 */
export function selectSessionWords(savedWords, dueWords, sessionSize) {
    let selectedWords = [];

    // First, take due words up to the session size limit
    if (dueWords.length > 0) {
        selectedWords = dueWords.slice(0, sessionSize);
    }

    // If we have fewer words than the session size, add random words from saved words
    if (selectedWords.length < sessionSize && savedWords.length > selectedWords.length) {
        const selectedWordLower = new Set(selectedWords.map(w => w.word.toLowerCase()));
        const availableWords = savedWords.filter(word =>
            !selectedWordLower.has(word.word.toLowerCase())
        );

        const remaining = sessionSize - selectedWords.length;
        const additionalWords = availableWords
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(remaining, availableWords.length));

        selectedWords = [...selectedWords, ...additionalWords];
    }

    // If no words were due and we still don't have enough, use random selection
    if (selectedWords.length === 0 && savedWords.length > 0) {
        selectedWords = savedWords
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(sessionSize, savedWords.length));
    }

    // Limit to session size
    selectedWords = selectedWords.slice(0, sessionSize);

    // Add slight randomization while keeping priority on due words
    const priorityWords = selectedWords.slice(0, Math.ceil(selectedWords.length / 2));
    const otherWords = selectedWords.slice(Math.ceil(selectedWords.length / 2));

    return [
        ...priorityWords.sort(() => Math.random() - 0.5),
        ...otherWords.sort(() => Math.random() - 0.5)
    ];
}
