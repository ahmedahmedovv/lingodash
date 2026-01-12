-- FSRS (Free Spaced Repetition Scheduler) Migration for LingoDash
-- This script adds FSRS-specific columns to the existing words table

-- Add FSRS columns to words table
ALTER TABLE words ADD COLUMN IF NOT EXISTS stability DECIMAL(5,2) DEFAULT 0.0;
ALTER TABLE words ADD COLUMN IF NOT EXISTS difficulty DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE words ADD COLUMN IF NOT EXISTS elapsed_days INTEGER DEFAULT 0;
ALTER TABLE words ADD COLUMN IF NOT EXISTS scheduled_days INTEGER DEFAULT 0;
ALTER TABLE words ADD COLUMN IF NOT EXISTS reps INTEGER DEFAULT 0;
ALTER TABLE words ADD COLUMN IF NOT EXISTS lapses INTEGER DEFAULT 0;
ALTER TABLE words ADD COLUMN IF NOT EXISTS last_review TIMESTAMPTZ;
ALTER TABLE words ADD COLUMN IF NOT EXISTS fsrs_state JSONB DEFAULT '{"algorithm": "sm2", "version": "legacy"}';

-- Add comment to document FSRS fields
COMMENT ON COLUMN words.stability IS 'FSRS: Memory stability metric (higher = more stable memory)';
COMMENT ON COLUMN words.difficulty IS 'FSRS: Word difficulty rating (1-10, higher = harder)';
COMMENT ON COLUMN words.elapsed_days IS 'FSRS: Days since last review';
COMMENT ON COLUMN words.scheduled_days IS 'FSRS: Days originally scheduled for review';
COMMENT ON COLUMN words.reps IS 'FSRS: Total number of reviews';
COMMENT ON COLUMN words.lapses IS 'FSRS: Number of times forgotten (incorrect answers)';
COMMENT ON COLUMN words.last_review IS 'FSRS: Timestamp of last review';
COMMENT ON COLUMN words.fsrs_state IS 'FSRS: Algorithm state and metadata';

-- Create indexes for FSRS query performance
CREATE INDEX IF NOT EXISTS idx_words_stability ON words(user_id, stability);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(user_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_words_reps ON words(user_id, reps);
CREATE INDEX IF NOT EXISTS idx_words_fsrs_state ON words USING GIN(fsrs_state);

-- Create FSRS parameters table for algorithm tuning
CREATE TABLE IF NOT EXISTS fsrs_parameters (
    id SERIAL PRIMARY KEY,
    version VARCHAR(10) NOT NULL UNIQUE,
    parameters JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- Insert default FSRS parameters (version 1.0)
INSERT INTO fsrs_parameters (version, parameters, is_active, description) VALUES (
    '1.0',
    '{
        "w": [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
        "requestRetention": 0.9,
        "maximumInterval": 36500,
        "easyBonus": 1.3,
        "hardInterval": 1.2,
        "decay": -0.5,
        "factor": 0.9
    }',
    true,
    'Default FSRS parameters optimized for language learning'
) ON CONFLICT (version) DO NOTHING;

-- Update fsrs_state for existing records to mark them as legacy SM-2 data
UPDATE words
SET fsrs_state = '{"algorithm": "sm2", "version": "legacy", "needsMigration": true}'
WHERE fsrs_state IS NULL OR fsrs_state->>'algorithm' IS NULL;

-- Function to calculate initial FSRS values from SM-2 data
CREATE OR REPLACE FUNCTION calculate_initial_fsrs(
    review_count INTEGER,
    interval_days INTEGER,
    correct_count INTEGER
) RETURNS JSONB AS $$
DECLARE
    initial_stability DECIMAL(5,2);
    initial_difficulty DECIMAL(3,2);
    accuracy_rate DECIMAL(3,2);
BEGIN
    -- Calculate initial stability based on existing interval
    IF review_count = 0 THEN
        initial_stability := 0.0;
    ELSIF review_count = 1 THEN
        initial_stability := GREATEST(1.0, interval_days * 0.8);
    ELSE
        initial_stability := GREATEST(1.0, interval_days * 0.9);
    END IF;

    -- Calculate initial difficulty based on accuracy
    IF review_count = 0 THEN
        initial_difficulty := 5.0;
    ELSE
        accuracy_rate := correct_count::DECIMAL / review_count::DECIMAL;
        CASE
            WHEN accuracy_rate > 0.9 THEN initial_difficulty := 3.0;
            WHEN accuracy_rate > 0.7 THEN initial_difficulty := 5.0;
            WHEN accuracy_rate > 0.5 THEN initial_difficulty := 7.0;
            ELSE initial_difficulty := 9.0;
        END CASE;
    END IF;

    RETURN jsonb_build_object(
        'stability', initial_stability,
        'difficulty', initial_difficulty,
        'algorithm', 'fsrs',
        'version', '1.0',
        'migrated', true,
        'migration_date', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Migration function to convert SM-2 words to FSRS
CREATE OR REPLACE FUNCTION migrate_sm2_to_fsrs(user_uuid UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    word_record RECORD;
    migrated_count INTEGER := 0;
    fsrs_data JSONB;
BEGIN
    -- Migrate words for specific user or all users
    FOR word_record IN
        SELECT id, review_count, interval, correct_count
        FROM words
        WHERE (user_uuid IS NULL OR user_id = user_uuid)
        AND (fsrs_state->>'algorithm' = 'sm2' OR fsrs_state->>'needsMigration' = 'true')
    LOOP
        -- Calculate initial FSRS values
        fsrs_data := calculate_initial_fsrs(
            COALESCE(word_record.review_count, 0),
            COALESCE(word_record.interval, 1),
            COALESCE(word_record.correct_count, 0)
        );

        -- Update the word with FSRS values
        UPDATE words SET
            stability = fsrs_data->>'stability',
            difficulty = fsrs_data->>'difficulty',
            elapsed_days = COALESCE(word_record.interval, 1),
            scheduled_days = COALESCE(word_record.interval, 1),
            reps = COALESCE(word_record.review_count, 0),
            lapses = COALESCE(word_record.review_count, 0) - COALESCE(word_record.correct_count, 0),
            last_review = COALESCE(updated_at, created_at),
            fsrs_state = fsrs_data
        WHERE id = word_record.id;

        migrated_count := migrated_count + 1;
    END LOOP;

    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Run migration for all users (commented out - run manually after testing)
-- SELECT migrate_sm2_to_fsrs();

-- Add trigger to automatically update fsrs_state for new words
CREATE OR REPLACE FUNCTION initialize_fsrs_for_new_word()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fsrs_state IS NULL OR NEW.fsrs_state->>'algorithm' IS NULL THEN
        NEW.fsrs_state := jsonb_build_object(
            'algorithm', 'fsrs',
            'version', '1.0',
            'initialized', true,
            'init_date', NOW()
        );
    END IF;

    -- Initialize FSRS values for new words
    IF NEW.stability IS NULL THEN
        NEW.stability := 0.0;
    END IF;

    IF NEW.difficulty IS NULL THEN
        NEW.difficulty := 5.0;
    END IF;

    IF NEW.elapsed_days IS NULL THEN
        NEW.elapsed_days := 0;
    END IF;

    IF NEW.scheduled_days IS NULL THEN
        NEW.scheduled_days := 0;
    END IF;

    IF NEW.reps IS NULL THEN
        NEW.reps := 0;
    END IF;

    IF NEW.lapses IS NULL THEN
        NEW.lapses := 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS trigger_initialize_fsrs_new_word ON words;
CREATE TRIGGER trigger_initialize_fsrs_new_word
    BEFORE INSERT ON words
    FOR EACH ROW EXECUTE FUNCTION initialize_fsrs_for_new_word();

-- Create optimized stats aggregation function for better performance
CREATE OR REPLACE FUNCTION get_fsrs_stats_fast(user_uuid TEXT, review_cutoff TIMESTAMPTZ)
RETURNS TABLE(
    total_words BIGINT,
    new_words BIGINT,
    learning_words BIGINT,
    mastered_words BIGINT,
    due_words BIGINT,
    avg_stability DECIMAL,
    avg_difficulty DECIMAL,
    total_reviews BIGINT,
    total_lapses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Total words
        COUNT(*)::BIGINT as total_words,

        -- New words (never reviewed)
        COUNT(*) FILTER (WHERE COALESCE(reps, review_count, 0) = 0)::BIGINT as new_words,

        -- Learning words (reviewed but low stability or legacy intervals)
        COUNT(*) FILTER (
            WHERE COALESCE(reps, review_count, 0) > 0
            AND (
                -- FSRS logic: stability between 0 and 21
                (stability > 0 AND stability < 21) OR
                -- Legacy fallback: interval between 1-29 days
                (stability IS NULL AND interval > 0 AND interval < 30)
            )
        )::BIGINT as learning_words,

        -- Mastered words (high stability or long intervals)
        COUNT(*) FILTER (
            WHERE stability >= 21 OR
                  (stability IS NULL AND interval >= 30)
        )::BIGINT as mastered_words,

        -- Due words (overdue for review)
        COUNT(*) FILTER (
            WHERE next_review <= review_cutoff OR next_review IS NULL
        )::BIGINT as due_words,

        -- Average stability (only for words that have been reviewed with FSRS)
        COALESCE(AVG(stability) FILTER (WHERE stability > 0), 0)::DECIMAL as avg_stability,

        -- Average difficulty
        COALESCE(AVG(COALESCE(difficulty, 5.0)), 5.0)::DECIMAL as avg_difficulty,

        -- Total reviews
        COALESCE(SUM(COALESCE(reps, review_count, 0)), 0)::BIGINT as total_reviews,

        -- Total lapses
        COALESCE(SUM(COALESCE(lapses, 0)), 0)::BIGINT as total_lapses

    FROM words
    WHERE user_id = user_uuid::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_fsrs_stats_fast(TEXT, TIMESTAMPTZ) TO authenticated;
