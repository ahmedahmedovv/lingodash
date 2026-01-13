/**
 * UI Saved Words Module
 * Handles saved words display, filtering, and pagination
 */

import { getSavedWordsPaginated, deleteWord } from '../storage/index.js';
import { showEditModal } from './modals.js';

// Pagination and filter state
let currentPage = 1;
let currentFilter = 'all';
const PAGE_SIZE = 50;

// Empty state messages for each filter
const EMPTY_MESSAGES = {
    all: 'No saved words yet',
    new: 'No new words. All words have been reviewed!',
    learning: 'No words in learning phase',
    mastered: 'No mastered words yet. Keep practicing!',
    due: 'No words due for review. Great job!'
};

/**
 * Escape HTML attributes
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Get status badge HTML for a word
 * @param {Object} word - Word object
 * @returns {string} HTML for status badge
 */
function getWordStatusBadge(word) {
    if (word.reviewCount === 0) {
        return '<span class="word-badge new">New</span>';
    }

    const now = new Date();
    const nextReview = new Date(word.nextReview);

    if (nextReview <= now) {
        return '<span class="word-badge overdue">Due</span>';
    }

    if (word.interval >= 30) {
        return '<span class="word-badge mastered">Mastered</span>';
    }

    if (word.interval < 10) {
        return '<span class="word-badge learning">Learning</span>';
    }

    return '';
}

/**
 * Update filter button active states
 * @param {string} activeFilter - Currently active filter
 */
function updateFilterButtons(activeFilter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
}

/**
 * Render pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {string} HTML for pagination controls
 */
function renderPaginationControls(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    pages.push(`<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`);

    if (startPage > 1) {
        pages.push(`<button class="pagination-btn" data-page="1">1</button>`);
        if (startPage > 2) {
            pages.push(`<span class="pagination-ellipsis">...</span>`);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(`<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(`<span class="pagination-ellipsis">...</span>`);
        }
        pages.push(`<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`);
    }

    pages.push(`<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`);

    return pages.join('');
}

/**
 * Display saved words with pagination and filtering
 * @param {number} page - Page number to display
 * @param {string} filter - Filter to apply
 */
export async function displaySavedWords(page = 1, filter = currentFilter) {
    const savedWordsList = document.getElementById('savedWordsList');
    const paginationControls = document.getElementById('paginationControls');

    currentFilter = filter;
    updateFilterButtons(filter);

    savedWordsList.innerHTML = '<p class="loading">Loading words...</p>';
    paginationControls.innerHTML = '';

    const { words, totalCount, totalPages, currentPage: fetchedPage } = await getSavedWordsPaginated(page, PAGE_SIZE, filter);
    currentPage = fetchedPage;

    if (words.length === 0) {
        savedWordsList.innerHTML = `<p class="empty-state">${EMPTY_MESSAGES[filter] || EMPTY_MESSAGES.all}</p>`;
        paginationControls.innerHTML = '';
        return;
    }

    savedWordsList.innerHTML = words.map((item, index) => `
        <div class="saved-word-item">
            <div class="saved-word-header">
                <span class="saved-word-title">${item.word}</span>
                ${getWordStatusBadge(item)}
                <div class="saved-word-actions">
                    <button class="edit-btn" data-word="${item.word}" data-definition="${escapeAttr(item.definition)}" data-example="${escapeAttr(item.example || '')}" data-index="${index}">✎</button>
                    <button class="delete-btn" data-word="${item.word}" data-index="${index}">×</button>
                </div>
            </div>
            <p class="saved-definition">${item.definition}</p>
            ${item.example ? `<p class="saved-example">${item.example}</p>` : ''}
        </div>
    `).join('');

    paginationControls.innerHTML = renderPaginationControls(currentPage, totalPages);

    // Add event listeners for pagination buttons
    paginationControls.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetPage = parseInt(e.target.getAttribute('data-page'), 10);
            if (!isNaN(targetPage) && targetPage !== currentPage) {
                await displaySavedWords(targetPage, currentFilter);
                savedWordsList.scrollTop = 0;
            }
        });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const word = e.target.getAttribute('data-word');
            const success = await deleteWord(word);
            if (success) {
                const pageToShow = words.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                await displaySavedWords(pageToShow);
            } else {
                alert('Failed to delete word. Please try again.');
            }
        });
    });

    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const word = e.target.getAttribute('data-word');
            const definition = e.target.getAttribute('data-definition');
            const example = e.target.getAttribute('data-example');
            showEditModal(word, definition, example);
        });
    });
}

/**
 * Initialize filter button event listeners
 */
export function initFilterControls() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            if (filter !== currentFilter) {
                displaySavedWords(1, filter);
            }
        });
    });
}

/**
 * Get the current page number
 * @returns {number} Current page
 */
export function getCurrentPage() {
    return currentPage;
}
