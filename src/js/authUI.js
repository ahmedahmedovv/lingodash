/**
 * Auth UI Module
 * Handles authentication UI rendering and form handling
 */

import { signIn, signUp, signOut, getCurrentUser } from './auth.js';

/**
 * Show auth UI and hide app
 */
export function showAuthUI() {
    const authWrapper = document.getElementById('authWrapper');
    const appWrapper = document.getElementById('appWrapper');
    if (authWrapper) authWrapper.style.display = 'flex';
    if (appWrapper) appWrapper.style.display = 'none';
}

/**
 * Show app UI and hide auth
 */
export function showAppUI() {
    const authWrapper = document.getElementById('authWrapper');
    const appWrapper = document.getElementById('appWrapper');
    if (authWrapper) authWrapper.style.display = 'none';
    if (appWrapper) appWrapper.style.display = 'flex';
}

/**
 * Update UI based on auth state
 */
export async function updateAuthUI() {
    const user = await getCurrentUser();

    if (user) {
        showAppUI();
        const userEmailDisplay = document.getElementById('userEmail');
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email || 'User';
        }
    } else {
        showAuthUI();
    }
}

/**
 * Switch between sign in and sign up tabs
 * @param {string} mode - Auth mode ('signin' or 'signup')
 */
export function switchAuthTab(mode) {
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

/**
 * Initialize auth UI event listeners
 */
export function initAuthUI() {
    initSigninForm();
    initSignupForm();
    initAuthTabSwitching();
    initLogoutButton();
}

/**
 * Initialize sign in form
 */
function initSigninForm() {
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
}

/**
 * Initialize sign up form
 */
function initSignupForm() {
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
}

/**
 * Initialize auth tab switching
 */
function initAuthTabSwitching() {
    const authTabButtons = document.querySelectorAll('.auth-tab-btn');
    authTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-auth-mode');
            switchAuthTab(mode);
        });
    });
}

/**
 * Initialize logout button
 */
function initLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const result = await signOut();
            if (result.success) {
                await updateAuthUI();
            }
        });
    }
}
