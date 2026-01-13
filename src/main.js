/**
 * LingoDash - Main Entry Point
 * Orchestrates app initialization and feature setup
 */

import './css/style.css';
import { initLookup } from './js/lookup.js';
import { initTabs, displaySavedWords, showExportMenu, initFilterControls } from './js/ui/index.js';
import { initExercise, prefetchExerciseData } from './js/exercise/index.js';
import { clearAllWords } from './js/storage/index.js';
import { onAuthStateChange, getCurrentUser } from './js/auth.js';
import { initAuthUI, updateAuthUI } from './js/authUI.js';

// Track if app features are initialized
let appFeaturesInitialized = false;

/**
 * Initialize the app
 */
export async function initApp() {
    // Initialize auth UI
    initAuthUI();

    // Check initial auth state
    await updateAuthUI();

    // Listen to auth state changes
    onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        await updateAuthUI();
    });
}

/**
 * Initialize app features (only called when authenticated)
 */
function initAppFeatures() {
    // Initialize tabs
    initTabs();

    // Initialize lookup functionality
    initLookup();

    // Initialize filter controls for saved words
    initFilterControls();

    // Display saved words
    displaySavedWords();

    // Initialize exercise
    initExercise();

    // Pre-fetch exercise data in background for instant loading
    prefetchExerciseData();

    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
            const success = await clearAllWords();
            if (success) {
                await displaySavedWords();
            }
        });
    }

    // Export words button
    const exportWordsBtn = document.getElementById('exportWords');
    if (exportWordsBtn) {
        exportWordsBtn.addEventListener('click', () => {
            showExportMenu();
        });
    }
}

/**
 * Initialize app features only once
 */
export function initAppFeaturesOnce() {
    if (appFeaturesInitialized) return;
    appFeaturesInitialized = true;
    initAppFeatures();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    await initApp();

    // Initialize app features if user is already authenticated
    const user = await getCurrentUser();
    if (user) {
        initAppFeaturesOnce();
    }

    // Listen for auth changes to init features when user logs in
    onAuthStateChange(async (event, session) => {
        if (session && !appFeaturesInitialized) {
            initAppFeaturesOnce();
        } else if (!session) {
            // Reset flag when user logs out so features can be re-initialized on next login
            appFeaturesInitialized = false;
        }
    });
});
