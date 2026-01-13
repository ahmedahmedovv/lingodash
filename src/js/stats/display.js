/**
 * Stats Display Module
 * Handles rendering statistics to the UI
 */

/**
 * Display all statistics on the page
 * @param {Object} stats - Statistics object
 */
export function displayStats(stats) {
    updateOverviewCards(stats);
    updateLearningProgressChart(stats.learningProgress);
    updateStabilityChart(stats.stabilityDistribution);
    updateWordStatusBreakdown(stats.wordStatusBreakdown);
    updateFSRSDetailedMetrics(stats.fsrsMetrics);
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
 * Show loading state for stats
 */
export function showStatsLoading() {
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
 * Show error state for stats
 * @param {string} message - Error message
 */
export function showStatsError(message) {
    const errorHTML = `<div class="stats-error">${message}</div>`;

    const chartContainers = ['learningProgressChart', 'stabilityChart'];
    chartContainers.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = errorHTML;
        }
    });
}
