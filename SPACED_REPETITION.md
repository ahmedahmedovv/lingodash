# Spaced Repetition System

## Overview

LingoDash now uses a **spaced repetition** technique to optimize vocabulary learning. This scientifically-proven method schedules word reviews at increasing intervals based on how well you remember them, ensuring efficient long-term retention.

## How It Works

### Algorithm

The system uses a simplified SuperMemo-inspired algorithm that tracks each word's learning progress:

1. **Initial Review**: New words are due for immediate review
2. **First Success**: After answering correctly, the word is scheduled for review in **1 day**
3. **Second Success**: After the second correct answer, the word is scheduled for **3 days**
4. **Subsequent Success**: Each subsequent correct answer multiplies the interval by an **ease factor** (starting at 2.5)
5. **Failure**: Incorrect answers reset the interval to immediate review

### Adaptive Difficulty

The system adapts to your performance with each word:

- **Easy words** (consistently correct): The ease factor increases (up to 3.0), making intervals grow faster
- **Difficult words** (frequently incorrect): The ease factor decreases (down to 1.3), keeping intervals shorter
- **Maximum interval**: Words won't be scheduled more than **365 days** in the future

## User Experience

### Starting an Exercise

When you start an exercise:

1. **Priority to due words**: Words that are due for review appear first
2. **Smart mixing**: If fewer than 5 words are due, additional words are added for variety
3. **Automatic tracking**: Your answers automatically update each word's review schedule

### Visual Due Date Indicators

Each word during the exercise displays its review status with color-coded badges:

- **🆕 New Word** (Blue): First time reviewing this word
- **🔥 Overdue** (Red): Word is past its review date - needs immediate attention
- **⏰ Due Today** (Orange): Word is scheduled for review today
- **📅 Due Tomorrow** (Purple): Word is scheduled for tomorrow
- **📅 Due in X Days** (Purple/Green): Upcoming review dates

### Word Statistics

After answering each question, you'll see:
- **Reviewed**: How many times you've practiced this word
- **Accuracy**: Your success rate with this word
- **Interval**: Current days until next review

### What Gets Tracked

For each word, the system tracks:

- `interval`: Days until the next review (0 = immediate)
- `easeFactor`: Multiplier for interval growth (1.3 to 3.0)
- `nextReview`: The date when the word is due for review
- `reviewCount`: Total number of times you've practiced this word
- `correctCount`: Number of correct answers

## Data Structure

Each saved word now includes spaced repetition metadata:

```javascript
{
  word: "example",
  definition: "a thing characteristic of its kind",
  example: "This is an example sentence.",
  timestamp: "2026-01-10T12:00:00.000Z",
  // Spaced repetition data
  interval: 3,
  easeFactor: 2.6,
  nextReview: "2026-01-13T12:00:00.000Z",
  reviewCount: 2,
  correctCount: 2
}
```

## Benefits

✅ **Efficient Learning**: Focus on words you're about to forget  
✅ **Personalized**: Adapts to your individual performance with each word  
✅ **Long-term Retention**: Scientific intervals maximize memory retention  
✅ **Automatic**: No manual scheduling needed  
✅ **Progressive**: Easier words naturally appear less often

## Technical Details

### Key Functions

#### `updateWordReview(word, isCorrect)`
Updates a word's spaced repetition data after review.

**Parameters:**
- `word` (string): The word that was reviewed
- `isCorrect` (boolean): Whether the answer was correct

**Logic:**
- Correct answer: Increases interval (1 → 3 → 3×EF → ...)
- Incorrect answer: Resets interval to 0 (immediate review)
- Adjusts ease factor based on performance

#### `getWordsDueForReview()`
Returns words that are due for review.

**Returns:**
- Array of words where `nextReview <= current date`
- Sorted by review date (most overdue first)
- Includes words without review data (newly added)

### Backward Compatibility

The system is fully backward compatible:

- Existing words without spaced repetition data are initialized on first review
- Updated word definitions preserve existing review progress
- Old localStorage data continues to work seamlessly

## Examples

### Scenario 1: Learning a New Word

```
Day 0: Add "ephemeral" - interval: 0 (immediate review)
Day 0: Answer correctly - interval: 1 (review tomorrow)
Day 1: Answer correctly - interval: 3 (review in 3 days)
Day 4: Answer correctly - interval: 8 (review in 8 days)
Day 12: Answer correctly - interval: 20 (review in 20 days)
```

### Scenario 2: Struggling with a Word

```
Day 0: Add "ubiquitous" - interval: 0
Day 0: Answer correctly - interval: 1
Day 1: Answer incorrectly - interval: 0 (reset, ease factor decreased)
Day 1: Answer correctly - interval: 1
Day 2: Answer correctly - interval: 3
Day 5: Answer correctly - interval: 7 (shorter growth due to lower ease factor)
```

## Future Enhancements

Potential improvements for the system:

- Visual indicators showing which words are due for review
- Statistics dashboard showing learning progress
- Customizable intervals and ease factors
- Export/import of learning progress
- Leitner system as an alternative algorithm

## References

This implementation is inspired by:

- **SuperMemo Algorithm**: The foundational spaced repetition system
- **Anki**: Popular flashcard application using spaced repetition
- **Cognitive Science**: Research on memory consolidation and recall

---

*The spaced repetition system helps you learn more effectively by reviewing words at optimal intervals, ensuring they move from short-term to long-term memory.*
