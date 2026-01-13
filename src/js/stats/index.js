/**
 * Stats Module - Main Entry Point
 * Orchestrates stats functionality
 */

import { calculateStats, convertStatsToCSV } from './calculations.js';
import { displayStats, showStatsLoading, showStatsError } from './display.js';

/**
 * Initialize the stats page
 */
export function initStatsPage() {
    const refreshBtn = document.getElementById('refreshStats');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadStats(true));
    }

    loadStats();
}

/**
 * Load and display all statistics
 * @param {boolean} forceRefresh - Force refresh from database
 */
export async function loadStats(forceRefresh = false) {
    try {
        showStatsLoading();

        const stats = await calculateStats(forceRefresh);
        displayStats(stats);

    } catch (error) {
        console.error('Error loading stats:', error);
        showStatsError('Failed to load statistics. Please try again.');
    }
}

/**
 * Export stats data
 * @param {string} format - Export format ('json' or 'csv')
 */
export async function exportStats(format = 'json') {
    try {
        const stats = await calculateStats(true);

        let content, filename, mimeType;

        if (format === 'csv') {
            content = convertStatsToCSV(stats);
            filename = `lingodash-stats-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        } else {
            content = JSON.stringify(stats, null, 2);
            filename = `lingodash-stats-${new Date().toISOString().split('T')[0]}.json`;
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

    } catch (error) {
        console.error('Error exporting stats:', error);
        alert('Failed to export statistics. Please try again.');
    }
}
