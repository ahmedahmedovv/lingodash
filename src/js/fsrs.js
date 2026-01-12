/**
 * Free Spaced Repetition Scheduler (FSRS) Implementation for LingoDash
 *
 * This module provides the core FSRS algorithm for advanced spaced repetition
 * that adapts to individual word difficulty and memory patterns.
 */

// FSRS Rating System (4-point scale)
export const FSRS_RATING = {
  AGAIN: 1,    // Complete blackout, wrong answer
  HARD: 2,     // Incorrect answer, but remembered something
  GOOD: 3,     // Correct with serious difficulty
  EASY: 4      // Perfect, effortless recall
};

// Default FSRS parameters optimized for language learning
const DEFAULT_FSRS_PARAMS = {
  // Memory stability parameters (w array)
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],

  // Algorithm tuning parameters
  requestRetention: 0.9,  // Target retention rate (90%)
  maximumInterval: 36500, // Maximum days between reviews (100 years)
  easyBonus: 1.3,         // Bonus multiplier for easy ratings
  hardInterval: 1.2,      // Multiplier for hard ratings
  decay: -0.5,            // Memory decay rate
  factor: 0.9             // Difficulty adjustment factor
};

/**
 * Main FSRS class implementing the algorithm
 */
export class FSRS {
  constructor(parameters = DEFAULT_FSRS_PARAMS) {
    this.w = parameters.w;
    this.requestRetention = parameters.requestRetention;
    this.maximumInterval = parameters.maximumInterval;
    this.easyBonus = parameters.easyBonus;
    this.hardInterval = parameters.hardInterval;
    this.decay = parameters.decay;
    this.factor = parameters.factor;
  }

  /**
   * Calculate next review interval and update FSRS values
   * @param {Object} word - Word object with current FSRS state
   * @param {number} rating - FSRS rating (1-4)
   * @param {number} responseTime - Response time in milliseconds (optional)
   * @returns {Object} Updated word state with new FSRS values
   */
  calculateNextReview(word, rating, responseTime = null) {
    const now = new Date();

    // Initialize values for new words
    let stability = word.stability || 0;
    let difficulty = word.difficulty || 5.0;
    let reps = word.reps || 0;
    let lapses = word.lapses || 0;
    let elapsedDays = word.elapsed_days || 0;
    let scheduledDays = word.scheduled_days || 0;

    // Calculate new stability and difficulty
    const newStability = this.calculateStability(stability, difficulty, rating);
    const newDifficulty = this.calculateDifficulty(difficulty, rating);

    // Calculate next interval
    let interval;
    if (rating === FSRS_RATING.AGAIN) {
      interval = Math.max(1, Math.round(newStability * 0.25));
    } else {
      interval = Math.max(1, Math.round(newStability));
    }

    // Apply maximum interval cap
    interval = Math.min(interval, this.maximumInterval);

    // Update review counts
    const newReps = reps + 1;
    const newLapses = rating === FSRS_RATING.AGAIN ? lapses + 1 : lapses;

    // Calculate forgetting adjustment if overdue
    if (elapsedDays > scheduledDays && scheduledDays > 0) {
      const forgettingAdjustment = this.w[12] * Math.exp((elapsedDays - scheduledDays) * this.w[13]);
      interval = Math.max(1, Math.round(interval * forgettingAdjustment));
    }

    // Prepare next review date
    const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    return {
      // Updated FSRS values
      stability: Math.max(0.1, Math.min(36500, newStability)),
      difficulty: Math.max(1, Math.min(10, newDifficulty)),
      elapsed_days: interval,
      scheduled_days: interval,
      reps: newReps,
      lapses: newLapses,
      last_review: now,
      next_review: nextReview,

      // Metadata
      fsrs_state: {
        algorithm: 'fsrs',
        version: '1.0',
        last_rating: rating,
        response_time: responseTime,
        calculated_at: now.toISOString()
      }
    };
  }

  /**
   * Calculate new memory stability based on rating
   * @param {number} stability - Current stability
   * @param {number} difficulty - Current difficulty
   * @param {number} rating - FSRS rating (1-4)
   * @returns {number} New stability value
   */
  calculateStability(stability, difficulty, rating) {
    const w = this.w;
    let newStability;

    switch (rating) {
      case FSRS_RATING.AGAIN:
        newStability = w[0] * Math.pow(stability, w[1]) * Math.exp((1 - difficulty) * w[2]);
        break;
      case FSRS_RATING.HARD:
        newStability = stability * w[3];
        break;
      case FSRS_RATING.GOOD:
        newStability = stability * w[4] * Math.exp((1 - difficulty) * w[5]);
        break;
      case FSRS_RATING.EASY:
        newStability = stability * w[6] * Math.exp((1 - difficulty) * w[7]);
        break;
      default:
        throw new Error(`Invalid FSRS rating: ${rating}`);
    }

    return Math.max(0.1, Math.min(36500, newStability));
  }

  /**
   * Calculate new difficulty based on rating
   * @param {number} difficulty - Current difficulty
   * @param {number} rating - FSRS rating (1-4)
   * @returns {number} New difficulty value
   */
  calculateDifficulty(difficulty, rating) {
    const w = this.w;
    let difficultyDelta;

    switch (rating) {
      case FSRS_RATING.AGAIN:
        difficultyDelta = w[8];
        break;
      case FSRS_RATING.HARD:
        difficultyDelta = w[9];
        break;
      case FSRS_RATING.GOOD:
        difficultyDelta = w[10];
        break;
      case FSRS_RATING.EASY:
        difficultyDelta = w[11];
        break;
      default:
        throw new Error(`Invalid FSRS rating: ${rating}`);
    }

    const newDifficulty = difficulty + difficultyDelta;
    return Math.max(1, Math.min(10, newDifficulty));
  }

  /**
   * Determine FSRS rating based on correctness and response time
   * @param {boolean} isCorrect - Whether the answer was correct
   * @param {number} responseTimeMs - Response time in milliseconds
   * @returns {number} FSRS rating (1-4)
   */
  determineRating(isCorrect, responseTimeMs) {
    if (!isCorrect) {
      return FSRS_RATING.AGAIN;
    }

    // Correct answers get graded by response speed
    if (responseTimeMs < 2000) {
      return FSRS_RATING.EASY;  // Very fast = easy word
    } else if (responseTimeMs < 5000) {
      return FSRS_RATING.GOOD;  // Moderate speed = good recall
    } else {
      return FSRS_RATING.HARD;  // Slow but correct = difficult word
    }
  }

  /**
   * Calculate retention probability for a word
   * @param {number} stability - Current stability
   * @param {number} elapsedDays - Days since last review
   * @returns {number} Retention probability (0-1)
   */
  calculateRetentionProbability(stability, elapsedDays) {
    if (stability <= 0) return 0;
    return Math.exp(Math.log(0.9) * elapsedDays / stability);
  }

  /**
   * Get recommended review interval for optimal retention
   * @param {number} stability - Current stability
   * @param {number} targetRetention - Target retention rate (default: 0.9)
   * @returns {number} Recommended interval in days
   */
  getOptimalInterval(stability, targetRetention = 0.9) {
    if (stability <= 0) return 1;

    const interval = stability * Math.log(targetRetention) / Math.log(0.9);
    return Math.max(1, Math.min(this.maximumInterval, Math.round(interval)));
  }
}

/**
 * Utility function to initialize FSRS values for a new word
 * @param {Object} word - Word object
 * @returns {Object} Word with initialized FSRS values
 */
export function initializeFSRSWord(word) {
  const now = new Date();

  return {
    ...word,
    stability: 0.0,
    difficulty: 5.0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    last_review: now,
    fsrs_state: {
      algorithm: 'fsrs',
      version: '1.0',
      initialized: true,
      init_date: now.toISOString()
    }
  };
}

/**
 * Convert SM-2 data to initial FSRS values
 * @param {Object} sm2Word - Word with SM-2 data
 * @returns {Object} Word with initial FSRS values
 */
export function convertSM2ToFSRS(sm2Word) {
  const { review_count = 0, interval = 1, correct_count = 0 } = sm2Word;

  // Calculate initial stability based on existing interval
  let initialStability;
  if (review_count === 0) {
    initialStability = 0.0;
  } else if (review_count === 1) {
    initialStability = Math.max(1.0, interval * 0.8);
  } else {
    initialStability = Math.max(1.0, interval * 0.9);
  }

  // Calculate initial difficulty based on accuracy
  let initialDifficulty = 5.0;
  if (review_count > 0) {
    const accuracyRate = correct_count / review_count;
    if (accuracyRate > 0.9) {
      initialDifficulty = 3.0;
    } else if (accuracyRate > 0.7) {
      initialDifficulty = 5.0;
    } else if (accuracyRate > 0.5) {
      initialDifficulty = 7.0;
    } else {
      initialDifficulty = 9.0;
    }
  }

  const now = new Date();

  return {
    ...sm2Word,
    stability: initialStability,
    difficulty: initialDifficulty,
    elapsed_days: interval,
    scheduled_days: interval,
    reps: review_count,
    lapses: review_count - correct_count,
    last_review: sm2Word.updated_at || sm2Word.created_at || now,
    fsrs_state: {
      algorithm: 'fsrs',
      version: '1.0',
      migrated: true,
      migration_date: now.toISOString(),
      original_algorithm: 'sm2'
    }
  };
}

/**
 * Singleton FSRS instance for the application
 */
export const fsrsInstance = new FSRS();

/**
 * Utility functions for FSRS integration
 */
export const FSRSUtils = {
  /**
   * Check if a word needs review based on FSRS schedule
   * @param {Object} word - Word object with FSRS data
   * @returns {boolean} Whether the word is due for review
   */
  isDueForReview(word) {
    if (!word.next_review) return true;
    return new Date(word.next_review) <= new Date();
  },

  /**
   * Get days until next review
   * @param {Object} word - Word object with FSRS data
   * @returns {number} Days until next review (negative if overdue)
   */
  getDaysUntilReview(word) {
    if (!word.next_review) return 0;

    const now = new Date();
    const nextReview = new Date(word.next_review);
    const diffTime = nextReview - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  },

  /**
   * Get word status based on FSRS metrics
   * @param {Object} word - Word object with FSRS data
   * @returns {string} Status: 'new', 'learning', 'mastered', 'overdue'
   */
  getWordStatus(word) {
    // Handle legacy SM-2 data or unmigrated words
    const reps = word.reps || 0;
    const reviewCount = word.review_count || word.reviewCount || 0;
    const stability = word.stability || 0;
    const interval = word.interval || word.elapsed_days || 0;

    // Use the higher of FSRS reps or legacy review_count
    const totalReviews = Math.max(reps, reviewCount);

    // New words (never reviewed with any algorithm)
    if (totalReviews === 0) {
      return 'new';
    }

    // Check if overdue using available data
    const daysUntilReview = this.getDaysUntilReview(word);
    if (daysUntilReview < 0) {
      return 'overdue';
    }

    // Use FSRS stability if available and reviews have happened with FSRS
    if (stability > 0 && reps > 0) {
      // FSRS logic: stability >= 21 is mastered, < 7 is learning
      if (stability >= 21) {
        return 'mastered';
      } else if (stability < 7) {
        return 'learning';
      } else {
        return 'learning'; // Medium stability still learning
      }
    } else if (reviewCount > 0) {
      // Fallback to legacy SM-2 logic if we have SM-2 review data
      if (interval >= 30) {
        return 'mastered';
      } else if (interval >= 10) {
        return 'learning';
      } else {
        return 'learning';
      }
    } else {
      // FSRS fields exist but no reviews yet - still learning
      return 'learning';
    }
  }
};
