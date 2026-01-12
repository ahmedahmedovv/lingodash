/**
 * FSRS Statistics Page Implementation for LingoDash
 *
 * This module provides comprehensive analytics and visualization
 * for FSRS (Free Spaced Repetition Scheduler) learning progress.
 */

import { getSavedWordsFSRS, getFSRSStats as getFSRSStatsFromStorage } from './storage.js';
import { FSRSUtils } from './fsrs.js';

// Cache for stats data to avoid repeated calculations
let statsCache = null;
let statsCacheTime = null;
const STATS_CACHE_DURATION = 60 * 1000; // 60 seconds (increased for better UX)

/**
 * Initialize the stats page
 */
export function initStatsPage() {
    // Set up event listeners
    const refreshBtn = document.getElementById('refreshStats');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadStats(true));
    }

    // Load stats on page initialization
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
 * Calculate comprehensive statistics
 * @param {boolean} forceRefresh - Force refresh from cache
 * @returns {Object} Statistics object
 */
async function calculateStats(forceRefresh = false) {
    // Check cache first
    const now = Date.now();
    if (!forceRefresh && statsCache && statsCacheTime &&
        (now - statsCacheTime) < STATS_CACHE_DURATION) {
        return statsCache;
    }

    // Get words and basic stats from storage
    const words = await getSavedWordsFSRS();
    const basicStats = await getFSRSStatsFromStorage();

    // Calculate detailed statistics
    const stats = {
        ...basicStats,
        wordStatusBreakdown: calculateWordStatusBreakdown(words),
        stabilityDistribution: calculateStabilityDistribution(words),
        learningProgress: calculateLearningProgress(words),
        fsrsMetrics: calculateFSRSDetailedMetrics(words),
        recentActivity: calculateRecentActivity(words),
        performanceTrends: calculatePerformanceTrends(words)
    };

    // Cache the results
    statsCache = stats;
    statsCacheTime = now;

    return stats;
}

/**
 * Calculate word status breakdown
 * @param {Array} words - Array of words with FSRS data
 * @returns {Object} Status breakdown
 */
function calculateWordStatusBreakdown(words) {
    const breakdown = {
        new: 0,
        learning: 0,
        mastered: 0,
        overdue: 0
    };

    words.forEach(word => {
        const status = FSRSUtils.getWordStatus(word);
        breakdown[status]++;
    });

    return breakdown;
}

/**
 * Calculate stability distribution for histogram
 * @param {Array} words - Array of words with FSRS data
 * @returns {Array} Stability distribution data
 */
function calculateStabilityDistribution(words) {
    const buckets = Array(10).fill(0); // 10 buckets for stability ranges

    words.forEach(word => {
        if (word.stability > 0) {
            const bucketIndex = Math.min(Math.floor(word.stability / 10), 9);
            buckets[bucketIndex]++;
        }
    });

    return buckets.map((count, index) => ({
        range: `${index * 10}-${(index + 1) * 10}`,
        count: count,
        percentage: words.length > 0 ? (count / words.length * 100).toFixed(1) : 0
    }));
}

/**
 * Calculate learning progress for visualization
 * @param {Array} words - Array of words with FSRS data
 * @returns {Array} Progress data by category
 */
function calculateLearningProgress(words) {
    const progress = [
        { category: 'New', count: 0, color: '#A0826D' },
        { category: 'Learning', count: 0, color: '#E65100' },
        { category: 'Mastered', count: 0, color: '#2E7D32' },
        { category: 'Overdue', count: 0, color: '#A0522D' }
    ];

    words.forEach(word => {
        const status = FSRSUtils.getWordStatus(word);
        const progressItem = progress.find(p => p.category.toLowerCase() === status);
        if (progressItem) {
            progressItem.count++;
        }
    });

    // Calculate percentages
    const total = words.length;
    progress.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    return progress;
}

/**
 * Calculate detailed FSRS metrics
 * @param {Array} words - Array of words with FSRS data
 * @returns {Object} Detailed FSRS metrics
 */
function calculateFSRSDetailedMetrics(words) {
    const validWords = words.filter(w => w.stability > 0);

    if (validWords.length === 0) {
        return {
            avgStability: 0,
            avgDifficulty: 5.0,
            retentionRate: 0,
            totalLapses: 0,
            accuracyRate: 0
        };
    }

    const avgStability = validWords.reduce((sum, w) => sum + w.stability, 0) / validWords.length;
    const avgDifficulty = validWords.reduce((sum, w) => sum + (w.difficulty || 5), 0) / validWords.length;
    const totalLapses = validWords.reduce((sum, w) => sum + (w.lapses || 0), 0);
    const totalReviews = validWords.reduce((sum, w) => sum + (w.reps || 0), 0);
    const accuracyRate = totalReviews > 0 ? ((totalReviews - totalLapses) / totalReviews) * 100 : 0;

    // Estimate retention rate based on stability (simplified calculation)
    const avgRetention = Math.min(95, Math.max(70, 90 - (avgStability / 100) * 10));

    return {
        avgStability: Math.round(avgStability * 10) / 10,
        avgDifficulty: Math.round(avgDifficulty * 10) / 10,
        retentionRate: Math.round(avgRetention),
        totalLapses: totalLapses,
        accuracyRate: Math.round(accuracyRate)
    };
}

/**
 * Calculate recent learning activity
 * @param {Array} words - Array of words with FSRS data
 * @returns {Array} Recent activity items
 */
function calculateRecentActivity(words) {
    // Get words reviewed in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWords = words
        .filter(word => word.last_review && new Date(word.last_review) > sevenDaysAgo)
        .sort((a, b) => new Date(b.last_review) - new Date(a.last_review))
        .slice(0, 10); // Top 10 most recent

    return recentWords.map(word => ({
        word: word.word,
        action: 'Reviewed',
        rating: getRatingDescription(word.last_rating),
        time: formatTimeAgo(new Date(word.last_review)),
        icon: getActivityIcon(word.last_rating)
    }));
}

/**
 * Calculate performance trends (placeholder for future enhancement)
 * @param {Array} words - Array of words with FSRS data
 * @returns {Object} Performance trend data
 */
function calculatePerformanceTrends(words) {
    // This could be enhanced with historical data tracking
    return {
        trend: 'stable', // 'improving', 'stable', 'declining'
        message: 'Learning performance is stable'
    };
}

/**
 * Get human-readable rating description
 * @param {number} rating - FSRS rating (1-4)
 * @returns {string} Rating description
 */
function getRatingDescription(rating) {
    switch (rating) {
        case 1: return 'Again (difficult)';
        case 2: return 'Hard';
        case 3: return 'Good';
        case 4: return 'Easy';
        default: return 'Unknown';
    }
}

/**
 * Get activity icon based on rating
 * @param {number} rating - FSRS rating (1-4)
 * @returns {string} Emoji icon
 */
function getActivityIcon(rating) {
    switch (rating) {
        case 1: return '😅'; // Again - struggling
        case 2: return '😅'; // Hard - challenging
        case 3: return '😊'; // Good - satisfactory
        case 4: return '🎉'; // Easy - excellent
        default: return '📚';
    }
}

/**
 * Format time ago string
 * @param {Date} date - Date to format
 * @returns {string} Time ago string
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

/**
 * Display statistics on the page
 * @param {Object} stats - Statistics object
 */
function displayStats(stats) {
    // Update overview cards
    updateOverviewCards(stats);

    // Update charts
    updateLearningProgressChart(stats.learningProgress);
    updateStabilityChart(stats.stabilityDistribution);

    // Update detailed stats
    updateWordStatusBreakdown(stats.wordStatusBreakdown);
    updateFSRSDetailedMetrics(stats.fsrsMetrics);

    // Update recent activity
    updateRecentActivity(stats.recentActivity);
}

/**
 * Update overview stat cards
 * @param {Object} stats - Statistics object
 */
function updateOverviewCards(stats) {
    const updates = [
        { id: 'totalWords', value: stats.totalWords },
        { id: 'wordsDue', value: stats.dueWords },
        { id: 'avgStability', value: stats.avgStability > 0 ? `${stats.avgStability}` : '--' },
        { id: 'totalReviews', value: stats.totalReviews }
    ];

    updates.forEach(update => {
        const element = document.getElementById(update.id);
        if (element) {
            element.textContent = update.value;
        }
    });
}

/**
 * Update learning progress chart
 * @param {Array} progressData - Progress data array
 */
function updateLearningProgressChart(progressData) {
    const chartContainer = document.getElementById('learningProgressChart');

    if (!progressData || progressData.length === 0) {
        chartContainer.innerHTML = '<div class="chart-placeholder">No data available</div>';
        return;
    }

    const maxCount = Math.max(...progressData.map(d => d.count));

    const chartHTML = `
        <div class="progress-bars">
            ${progressData.map(item => `
                <div class="progress-bar-item">
                    <div class="progress-bar-label">
                        <span class="label">${item.category}</span>
                        <span class="value">${item.count} (${item.percentage}%)</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill ${item.category.toLowerCase()}"
                             style="width: ${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    chartContainer.innerHTML = chartHTML;
}

/**
 * Update stability distribution chart
 * @param {Array} stabilityData - Stability distribution data
 */
function updateStabilityChart(stabilityData) {
    const chartContainer = document.getElementById('stabilityChart');

    if (!stabilityData || stabilityData.length === 0) {
        chartContainer.innerHTML = '<div class="chart-placeholder">No stability data available</div>';
        return;
    }

    const maxCount = Math.max(...stabilityData.map(d => d.count));

    const chartHTML = `
        <div class="stability-bars">
            ${stabilityData.map((bucket, index) => `
                <div class="stability-bar"
                     style="height: ${maxCount > 0 ? (bucket.count / maxCount) * 100 : 0}%"
                     data-tooltip="${bucket.range}: ${bucket.count} words (${bucket.percentage}%)">
                    <div class="stability-bar-tooltip">${bucket.range}<br>${bucket.count} words</div>
                </div>
            `).join('')}
        </div>
        <div class="stability-axis">
            <span>0</span>
            <span>50</span>
            <span>100</span>
        </div>
    `;

    chartContainer.innerHTML = chartHTML;
}

/**
 * Update word status breakdown
 * @param {Object} breakdown - Status breakdown object
 */
function updateWordStatusBreakdown(breakdown) {
    const updates = [
        { id: 'newWordsCount', value: breakdown.new },
        { id: 'learningWordsCount', value: breakdown.learning },
        { id: 'masteredWordsCount', value: breakdown.mastered },
        { id: 'overdueWordsCount', value: breakdown.overdue }
    ];

    updates.forEach(update => {
        const element = document.getElementById(update.id);
        if (element) {
            element.textContent = update.value;
        }
    });
}

/**
 * Update detailed FSRS metrics
 * @param {Object} metrics - FSRS metrics object
 */
function updateFSRSDetailedMetrics(metrics) {
    const updates = [
        { id: 'avgDifficulty', value: metrics.avgDifficulty },
        { id: 'retentionRate', value: `${metrics.retentionRate}%` },
        { id: 'totalLapses', value: metrics.totalLapses },
        { id: 'accuracyRate', value: `${metrics.accuracyRate}%` }
    ];

    updates.forEach(update => {
        const element = document.getElementById(update.id);
        if (element) {
            element.textContent = update.value;
        }
    });
}

/**
 * Update recent activity list
 * @param {Array} activities - Recent activities array
 */
function updateRecentActivity(activities) {
    const activityList = document.getElementById('recentActivity');

    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<div class="activity-placeholder">No recent activity</div>';
        return;
    }

    const activityHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <div class="activity-text">
                    <strong>${activity.word}</strong> - ${activity.action} (${activity.rating})
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');

    activityList.innerHTML = activityHTML;
}

/**
 * Show loading state
 */
function showStatsLoading() {
    const elements = [
        'totalWords', 'wordsDue', 'avgStability', 'totalReviews',
        'learningProgressChart', 'stabilityChart'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('Chart')) {
                element.innerHTML = '<div class="chart-placeholder">Loading...</div>';
            } else {
                element.textContent = '--';
            }
        }
    });
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showStatsError(message) {
    const errorHTML = `<div class="stats-error">${message}</div>`;

    const chartContainers = ['learningProgressChart', 'stabilityChart'];
    chartContainers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = errorHTML;
        }
    });
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

/**
 * Convert stats to CSV format
 * @param {Object} stats - Statistics object
 * @returns {string} CSV content
 */
function convertStatsToCSV(stats) {
    const headers = ['Metric', 'Value'];
    const rows = [
        ['Total Words', stats.totalWords],
        ['Words Due for Review', stats.dueWords],
        ['Average Stability', stats.avgStability],
        ['Total Reviews', stats.totalReviews],
        ['New Words', stats.wordStatusBreakdown.new],
        ['Learning Words', stats.wordStatusBreakdown.learning],
        ['Mastered Words', stats.wordStatusBreakdown.mastered],
        ['Overdue Words', stats.wordStatusBreakdown.overdue],
        ['Average Difficulty', stats.fsrsMetrics.avgDifficulty],
        ['Retention Rate (%)', stats.fsrsMetrics.retentionRate],
        ['Total Lapses', stats.fsrsMetrics.totalLapses],
        ['Accuracy Rate (%)', stats.fsrsMetrics.accuracyRate]
    ];

    const csvRows = [headers.join(',')];
    rows.forEach(row => {
        csvRows.push(`"${row[0]}","${row[1]}"`);
    });

    return csvRows.join('\n');
}
