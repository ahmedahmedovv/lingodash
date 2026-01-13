/**
 * Storage Module - Barrel Export
 * Re-exports all storage-related functions from submodules
 */

// CRUD operations
export {
    getSavedWords,
    getWordIfExists,
    saveWord,
    updateWord,
    deleteWord,
    clearAllWords,
    cleanupOldWords
} from './crud.js';

// Pagination
export { getSavedWordsPaginated } from './pagination.js';

// Review operations (legacy SM-2)
export {
    updateWordReview,
    getWordsDueForReview
} from './review.js';

// FSRS operations
export {
    updateWordReviewFSRS,
    getWordsDueForReviewFSRS,
    saveWordFSRS,
    getSavedWordsFSRS,
    getFSRSStats
} from './fsrs.js';

// Export functionality
export { exportWords } from './export.js';
