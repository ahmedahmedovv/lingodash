import './css/style.css';
import { initLookup } from './js/lookup.js';
import { initTabs, displaySavedWords, showExportMenu, initFilterControls } from './js/ui.js';
import { initExercise } from './js/exercise.js';
import { clearAllWords } from './js/storage.js';
import { signIn, signUp, signOut, onAuthStateChange, getCurrentUser } from './js/auth.js';

// UI elements
const authWrapper = document.getElementById('authWrapper');
const appWrapper = document.getElementById('appWrapper');
const userEmailDisplay = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Show auth UI and hide app
function showAuthUI() {
    if (authWrapper) authWrapper.style.display = 'flex';
    if (appWrapper) appWrapper.style.display = 'none';
}

// Show app UI and hide auth
function showAppUI() {
    if (authWrapper) authWrapper.style.display = 'none';
    if (appWrapper) appWrapper.style.display = 'flex';
}

// Update UI based on auth state
async function updateAuthUI() {
    const user = await getCurrentUser();
    
    if (user) {
        showAppUI();
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email || 'User';
        }
    } else {
        showAuthUI();
    }
}

// Initialize auth UI
function initAuthUI() {
    // Sign in form
    const signinForm = document.getElementById('signinFormElement');
    const signinEmail = document.getElementById('signinEmail');
    const signinPassword = document.getElementById('signinPassword');
    const signinError = document.getElementById('authError');
    
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (signinError) {
                signinError.style.display = 'none';
            }
            
            const submitBtn = signinForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            
            const result = await signIn(signinEmail.value.trim(), signinPassword.value);
            
            if (result.success) {
                await updateAuthUI();
                signinPassword.value = '';
            } else {
                if (signinError) {
                    signinError.textContent = result.error || 'Failed to sign in. Please try again.';
                    signinError.style.display = 'block';
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
    
    // Sign up form
    const signupForm = document.getElementById('signupFormElement');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupError = document.getElementById('signupAuthError');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (signupError) {
                signupError.style.display = 'none';
            }
            
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            const result = await signUp(signupEmail.value.trim(), signupPassword.value);
            
            if (result.success) {
                if (signupError) {
                    signupError.textContent = 'Account created! Please sign in.';
                    signupError.style.display = 'block';
                    signupError.style.background = '#d4edda';
                    signupError.style.color = '#155724';
                    signupError.style.borderColor = '#c3e6cb';
                }
                // Switch to sign in tab
                switchAuthTab('signin');
                signupEmail.value = '';
                signupPassword.value = '';
            } else {
                if (signupError) {
                    signupError.textContent = result.error || 'Failed to create account. Please try again.';
                    signupError.style.display = 'block';
                    signupError.style.background = '#FDF0E6';
                    signupError.style.color = '#A0522D';
                    signupError.style.borderColor = '#A0522D';
                }
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    }
    
    // Auth tab switching
    const authTabButtons = document.querySelectorAll('.auth-tab-btn');
    authTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-auth-mode');
            switchAuthTab(mode);
        });
    });
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const result = await signOut();
            if (result.success) {
                await updateAuthUI();
            }
        });
    }
}

// Switch between sign in and sign up tabs
function switchAuthTab(mode) {
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const authTabButtons = document.querySelectorAll('.auth-tab-btn');
    const signinError = document.getElementById('authError');
    const signupError = document.getElementById('signupAuthError');
    
    // Reset errors
    if (signinError) {
        signinError.style.display = 'none';
        signinError.style.background = '#FDF0E6';
        signinError.style.color = '#A0522D';
        signinError.style.borderColor = '#A0522D';
    }
    if (signupError) {
        signupError.style.display = 'none';
        signupError.style.background = '#FDF0E6';
        signupError.style.color = '#A0522D';
        signupError.style.borderColor = '#A0522D';
    }
    
    if (mode === 'signin') {
        if (signinForm) signinForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
        authTabButtons.forEach(btn => {
            if (btn.getAttribute('data-auth-mode') === 'signin') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    } else if (mode === 'signup') {
        if (signinForm) signinForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'block';
        authTabButtons.forEach(btn => {
            if (btn.getAttribute('data-auth-mode') === 'signup') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// Initialize the app
async function initApp() {
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

// Initialize app features (only called when authenticated)
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

// Track if app features are initialized
let appFeaturesInitialized = false;

// Initialize app features only once
function initAppFeaturesOnce() {
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
