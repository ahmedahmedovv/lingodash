/**
 * Stats Calculations Module
 * Handles all statistical computations
 */

import { getSavedWordsFSRS, getFSRSStats as getFSRSStatsFromStorage } from '../storage/index.js';
import { FSRSUtils } from '../fsrs.js';

// Cache for stats data to avoid repeated calculations
let statsCache = null;
let statsCacheTime = null;
const STATS_CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Calculate comprehensive statistics
 * @param {boolean} forceRefresh - Force refresh from cache
 * @returns {Object} Statistics object
 */
export async function calculateStats(forceRefresh = false) {
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
 * Clear the stats cache
 */
export function clearStatsCache() {
    statsCache = null;
    statsCacheTime = null;
}

/**
 * Calculate word status breakdown
 * @param {Array} words - Array of words with FSRS data
 * @returns {Object} Status breakdown
 */
export function calculateWordStatusBreakdown(words) {
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
export function calculateStabilityDistribution(words) {
    const buckets = Array(10).fill(0);

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
export function calculateLearningProgress(words) {
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
export function calculateFSRSDetailedMetrics(words) {
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

    // Estimate retention rate based on stability
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
export function calculateRecentActivity(words) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWords = words
        .filter(word => word.last_review && new Date(word.last_review) > sevenDaysAgo)
        .sort((a, b) => new Date(b.last_review) - new Date(a.last_review))
        .slice(0, 10);

    return recentWords.map(word => ({
        word: word.word,
        action: 'Reviewed',
        rating: getRatingDescription(word.last_rating),
        time: formatTimeAgo(new Date(word.last_review)),
        icon: getActivityIcon(word.last_rating)
    }));
}

/**
 * Calculate performance trends
 * @param {Array} words - Array of words with FSRS data
 * @returns {Object} Performance trend data
 */
export function calculatePerformanceTrends(words) {
    return {
        trend: 'stable',
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
        case 1: return '😅';
        case 2: return '😅';
        case 3: return '😊';
        case 4: return '🎉';
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
 * Convert stats to CSV format for export
 * @param {Object} stats - Statistics object
 * @returns {string} CSV content
 */
export function convertStatsToCSV(stats) {
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
