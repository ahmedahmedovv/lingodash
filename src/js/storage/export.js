/**
 * Storage Export Module
 * Handles exporting words in various formats
 */

import { getSavedWords } from './crud.js';

/**
 * Export words in different formats
 * @param {string} format - Export format ('json' or 'csv')
 */
export async function exportWords(format = 'json') {
    const words = await getSavedWords();

    if (words.length === 0) {
        alert('No words to export!');
        return;
    }

    let content, filename, mimeType;

    if (format === 'csv') {
        content = convertToCSV(words);
        filename = `lingodash-vocabulary-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
    } else {
        content = JSON.stringify(words, null, 2);
        filename = `lingodash-vocabulary-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
    }

    // Create download link
    downloadFile(content, filename, mimeType);
}

/**
 * Convert words array to CSV format
 * @param {Array} words - Array of word objects
 * @returns {string} CSV content
 */
function convertToCSV(words) {
    const headers = [
        'Word',
        'Definition',
        'Example',
        'Date Added',
        'Review Count',
        'Correct Count',
        'Next Review',
        'Interval (days)',
        'Stability',
        'Difficulty'
    ];

    const csvRows = [headers.join(',')];

    words.forEach(word => {
        const row = [
            `"${word.word}"`,
            `"${word.definition.replace(/"/g, '""')}"`,
            `"${(word.example || '').replace(/"/g, '""')}"`,
            `"${new Date(word.timestamp).toLocaleDateString()}"`,
            word.reviewCount || 0,
            word.correctCount || 0,
            word.nextReview ? `"${new Date(word.nextReview).toLocaleDateString()}"` : '""',
            word.interval || 0,
            word.stability || 0,
            word.difficulty || 5.0
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

/**
 * Download content as a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
