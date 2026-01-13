/**
 * UI Module - Barrel Export
 * Re-exports all UI-related functions from submodules
 */

// Tab navigation
export { initTabs, switchToTab } from './tabs.js';

// Saved words display
export {
    displaySavedWords,
    initFilterControls,
    getCurrentPage
} from './savedWords.js';

// Modal dialogs
export { showEditModal, showExportMenu } from './modals.js';

// Validation utilities
export {
    validateWordExample,
    containsWord,
    validateEmail,
    validatePassword
} from './validation.js';
