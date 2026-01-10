# Learning System Overview

## Persistent Learning Until Mastery

LingoDash implements a **persistent learning system** that ensures you truly master each word before moving on. This combines spaced repetition with in-session reinforcement.

## How It Works

### 🎯 Core Principle

**You must answer each word correctly at least once before completing a session.**

### 📋 Session Flow

1. **Start Exercise**
   - System selects words due for review (using spaced repetition)
   - Adds variety if fewer than 5 words are due
   - Presents words in a smart order (prioritizing overdue words)

2. **Answer Questions**
   - ✅ **Correct Answer**: Word is marked as "mastered" for this session
   - ❌ **Incorrect Answer**: Word is re-added to the queue (2-3 positions ahead)

3. **Persistent Reinforcement**
   - Incorrectly answered words keep reappearing
   - Each word must be answered correctly before session ends
   - No skipping difficult words!

4. **Session Complete**
   - All words have been mastered (answered correctly at least once)
   - View your performance: words mastered, total attempts, accuracy

## Visual Feedback

### During Exercise

**Due Date Badges** (shown before each question):
- 🆕 **New Word** - First time reviewing
- 🔥 **Overdue** - Past review date (X days overdue)
- ⏰ **Due Today** - Scheduled for today
- 📅 **Due Tomorrow** - Scheduled for tomorrow
- 📅 **Due in X Days** - Future review

**After Answering**:
- ✅ Correct: Green input, word highlighted in example
- ❌ Incorrect: Red input, word highlighted in example, "💡 You'll see this word again shortly"

**Word Statistics** (shown after each answer):
- **Reviewed**: Total times practiced (all sessions)
- **Accuracy**: Success rate across all sessions
- **Interval**: Days until next scheduled review

### Results Screen

```
5 words mastered

7 correct out of 10 attempts (70%)
```

Shows:
- **Unique words mastered** in this session
- **Total attempts** (including retries)
- **Overall accuracy** for the session

## Benefits

### 1. **Guaranteed Learning**
- Can't skip difficult words
- Must demonstrate mastery before moving on
- Builds confidence through successful repetition

### 2. **Immediate Reinforcement**
- See the correct answer immediately
- Practice again while it's fresh in memory
- Spaced within the session (2-3 questions apart)

### 3. **Long-term Retention**
- Spaced repetition schedules future reviews
- Difficult words appear more frequently over time
- Mastered words gradually extend to longer intervals

### 4. **Motivation & Progress**
- Clear visual feedback on progress
- See improvement in real-time
- Satisfying completion when all words are mastered

## Example Session

### Starting Words
```
Words to practice: [apple, courage, ephemeral, serendipity, ubiquitous]
```

### Question Flow
```
Q1: "ephemeral" → ❌ Wrong → Re-added
Q2: "apple" → ✅ Correct → Mastered (1/5)
Q3: "courage" → ❌ Wrong → Re-added
Q4: "serendipity" → ✅ Correct → Mastered (2/5)
Q5: "ubiquitous" → ✅ Correct → Mastered (3/5)
Q6: "ephemeral" → ❌ Wrong → Re-added
Q7: "courage" → ✅ Correct → Mastered (4/5)
Q8: "ephemeral" → ✅ Correct → Mastered (5/5)
```

### Final Results
```
✅ 5 words mastered
📊 5 correct out of 8 attempts (63%)
```

## Integration with Spaced Repetition

The persistent learning system works **in harmony** with spaced repetition:

### Within Session (Persistent Learning)
- Ensures immediate mastery
- Words repeat until correct
- Short intervals (2-3 questions)

### Between Sessions (Spaced Repetition)
- Schedules long-term reviews
- Adapts to your performance
- Intervals grow exponentially (1d → 3d → 8d → 20d...)

### Combined Effect
```
Session 1 (Day 0):
- Try "ephemeral" → Wrong → Try again → Wrong → Try again → Correct ✅
- Interval set to 1 day

Session 2 (Day 1):
- Try "ephemeral" → Correct ✅
- Interval set to 3 days

Session 3 (Day 4):
- Try "ephemeral" → Correct ✅
- Interval set to 8 days

Result: Word moves from "struggling" to "mastered" through persistent practice
```

## Best Practices

### For Learners

1. **Don't rush** - Take time to understand each word
2. **Learn from mistakes** - Read the example sentence carefully when wrong
3. **Complete sessions** - Finish what you start for maximum retention
4. **Regular practice** - Short daily sessions are better than long weekly ones

### Session Strategy

- **Short sessions** (5-10 words) for daily practice
- **Focus on due words** - Let the system prioritize for you
- **Review statistics** - Track your progress over time
- **Celebrate mastery** - Each completed session is an achievement!

## Technical Implementation

### Key Variables
```javascript
masteredWords = Set()      // Words answered correctly in this session
totalAttempts = 0          // Total questions answered
correctAnswers = 0         // Total correct answers
exerciseWords = []         // Current question queue
```

### Algorithm
```javascript
1. User answers question
2. If correct:
   - Add word to masteredWords
   - Increment correctAnswers
   - Move to next question
3. If incorrect:
   - Re-insert word 2-3 positions ahead
   - Show retry notice
   - Move to next question
4. Continue until masteredWords.size === unique word count
```

### Spaced Repetition Update
```javascript
// After each answer (correct or incorrect)
updateWordReview(word, isCorrect)

// Updates:
- interval (days until next review)
- easeFactor (learning difficulty)
- nextReview (scheduled date)
- reviewCount (total attempts)
- correctCount (total correct)
```

## Future Enhancements

Potential improvements:
- **Difficulty levels**: Easy/Medium/Hard word sets
- **Custom session length**: User-defined number of words
- **Streak tracking**: Consecutive days practiced
- **Achievement system**: Badges for milestones
- **Audio pronunciation**: Hear the word spoken
- **Progress charts**: Visualize learning over time

---

*The persistent learning system ensures that every practice session leads to genuine mastery, not just exposure.*
