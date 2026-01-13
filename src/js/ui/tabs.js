/**
 * UI Tabs Module
 * Handles tab navigation and switching
 */

import { displaySavedWords } from './savedWords.js';
import { initStatsPage } from '../stats/index.js';

/**
 * Initialize tab navigation
 */
export function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            document.getElementById(`${targetTab}-panel`).classList.add('active');

            // Update content when switching to specific tabs
            if (targetTab === 'saved') {
                displaySavedWords();
            } else if (targetTab === 'stats') {
                initStatsPage();
            }
        });
    });
}

/**
 * Switch to a specific tab programmatically
 * @param {string} tabName - Name of the tab to switch to
 */
export function switchToTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    tabPanels.forEach(panel => {
        if (panel.id === `${tabName}-panel`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
}
