# Features Overview

Complete guide to all LingoDash features and how to use them effectively.

## 🔐 User Authentication

Secure user accounts with Supabase authentication for personalized learning experiences.

### Creating an Account

1. **Visit the app** - LingoDash requires authentication to access features
2. **Click "Sign Up"** - Switch to the signup tab on the authentication screen
3. **Enter credentials**:
   - Valid email address
   - Password (minimum 6 characters)
4. **Verify email** - Check your email for verification (if required by Supabase)
5. **Sign in** - Use your credentials to access the app

### Signing In

1. **Click "Sign In"** - Use the default authentication tab
2. **Enter credentials** - Email and password
3. **Access granted** - Full app features become available

### Account Security

- **Secure authentication** via Supabase Auth
- **Session management** - Automatic session handling
- **Data isolation** - Each user sees only their own vocabulary
- **Logout** - Securely end your session anytime

### Benefits of Authentication

- **Personalized learning** - Your vocabulary collection is private
- **Cross-device sync** - Access your words from any device
- **Progress tracking** - Learning statistics tied to your account
- **Data persistence** - Your learning data is safely stored in the cloud

## 🔍 Word Lookup

The foundation of LingoDash - look up words and get AI-powered definitions.

### Single Word Lookup

1. **Enter a word** in the lookup field (🔍 tab)
2. **Press Enter** or click the lookup button
3. **View results**:
   - AI-generated definition
   - Example sentence with the word highlighted
   - Save option (💾 Save Word)

### Batch Word Lookup

Process multiple words at once for efficient vocabulary building:

1. **Switch to batch mode** using the mode toggle
2. **Enter words** (one per line) in the textarea
3. **Click "Batch Lookup"**
4. **View progress** as words are processed sequentially
5. **See results** with save status for each word

**Features:**
- ✅ Rate limiting (1 second between API calls)
- ✅ Auto-save successful lookups
- ✅ Progress indicators
- ✅ Error handling per word

## 💾 Save Words

Store your vocabulary in the cloud with full spaced repetition tracking.

### Saving Words

- **After lookup**: Click "💾 Save Word" or "✓ Already Saved (Update)"
- **From batch results**: Words are automatically saved during batch lookup
- **Duplicate handling**: Updates existing words instead of creating duplicates

### Saved Word Data

Each saved word includes:
- **Definition**: AI-generated explanation
- **Example**: Sentence showing usage
- **Review history**: Spaced repetition progress
- **Next review date**: When the word is due for practice

## 📚 Saved Words Management

View, organize, and manage your vocabulary collection.

### Viewing Saved Words

- **Switch to 📚 Saved Words tab**
- **Browse paginated list** (50 words per page)
- **Filter by status**:
  - **All**: Complete vocabulary
  - **New**: Never reviewed
  - **Learning**: In active study
  - **Mastered**: Long-term retention
  - **Due**: Ready for review

### Status Badges

Words display status indicators:
- **New** - First time saved
- **Learning** - Actively being learned (1-9 reviews)
- **Mastered** - Solid retention (10+ reviews)
- **Due indicators**: −3d (overdue), Today, +7d (scheduled)

### Word Management

**Edit Words:**
- Click ✎ (edit) button on any word
- Modify word, definition, or example
- Save changes (handles duplicates)

**Delete Words:**
- Click × (delete) button
- Confirm deletion dialog
- Removes from all future exercises

**Export Data:**
- JSON format (full data with spaced repetition fields)
- CSV format (spreadsheet-compatible)

## 💪 Exercise Mode

Practice your vocabulary with scientifically-proven spaced repetition.

### Starting Exercises

1. **Go to 🎯 Exercise tab**
2. **Choose session size**: 25 or 50 words
3. **Click "Start Exercise"**
4. **Minimum requirement**: 3 saved words

### Exercise Flow

**Question Display:**
- Word with first letter hint (e.g., "definition (D)")
- Example sentence with word blanked out
- Due date badge showing urgency

**Answering:**
- Type the correct word
- Press Enter to submit
- Immediate feedback with correct answer revealed

**Results:**
- Green checkmark for correct answers
- Red X with shake animation for incorrect
- Example sentence highlights the correct word

### Persistent Learning

**Key Feature**: Words must be answered correctly at least once per session.

- ✅ **Correct answers**: Word marked as mastered
- ❌ **Incorrect answers**: Word re-queued (2-3 questions later)
- 🔄 **Reappearance**: Difficult words keep appearing until mastered
- 🏁 **Session end**: Only when all words are mastered

### Session Statistics

After completion:
- **Words mastered**: Unique words learned this session
- **Accuracy percentage**: Correct answers / total attempts
- **Example**: "5 words mastered (7 correct out of 10 attempts - 70%)"

## 🧠 Spaced Repetition System

Intelligent scheduling that optimizes your learning.

### How It Works

**Algorithm**: Simplified SuperMemo-inspired system

**Intervals**:
- New word → 1 day → 3 days → 8 days → 20 days → etc.
- Incorrect answers → Reset to immediate review
- Performance adjusts intervals (easier words = longer gaps)

**Adaptive Difficulty**:
- **Easy words**: Intervals increase faster (ease factor up to 3.0)
- **Hard words**: Intervals increase slower (ease factor down to 1.3)
- **Personalized**: Learns from your performance

### Review Scheduling

- **Due words**: `next_review <= today`
- **Priority system**: Overdue words appear first
- **Smart selection**: Mix of due words + variety for balance

## ☁️ Cloud Storage

Your vocabulary persists across devices and sessions.

### Data Synchronization

- **Automatic saving**: All changes sync to Supabase
- **Cross-device**: Access from any browser
- **Offline-ready**: Changes queue when offline
- **Conflict resolution**: Latest changes win

### Privacy & Security

- **User isolation**: Each user sees only their words
- **Row Level Security**: Database-level access control
- **No personal data**: Only vocabulary and learning statistics

## 🎯 Advanced Features

### Keyboard Shortcuts

- **Enter**: Submit answer/lookup
- **Enter**: Continue to next question
- **Escape**: Cancel edit modal

### Visual Feedback

- **Animations**: Smooth transitions and micro-interactions
- **Color coding**: Status-based color schemes
- **Progress indicators**: Loading states and completion feedback

### Performance Optimizations

- **Caching**: Exercise data cached for 5 minutes
- **Pagination**: Large vocabularies load efficiently
- **Rate limiting**: API calls managed to prevent quota issues
- **Background updates**: Spaced repetition updates don't block UI

## 📊 Statistics & Progress

Track your learning journey with comprehensive analytics and progress visualization.

### Overview Dashboard

**Access statistics**: Switch to the 📊 Stats tab to view your learning analytics

**Overview Cards**:
- **Total Words**: Complete vocabulary count
- **Words Due**: Words ready for review today
- **Avg Stability**: Memory retention metric (FSRS)
- **Total Reviews**: Cumulative review sessions

### Learning Progress Chart

**Progress visualization**: Interactive chart showing vocabulary growth over time
- **X-axis**: Time periods (days/weeks)
- **Y-axis**: Number of words learned
- **Data points**: New words added per period

### Memory Stability Chart

**Retention analysis**: Distribution of memory stability across your vocabulary
- **Stability scores**: How well words are retained (FSRS algorithm)
- **Color coding**: Different stability ranges
- **Performance insights**: Areas needing more practice

### Word Status Breakdown

**Vocabulary composition**:
- **New Words**: Never reviewed (0 reviews)
- **Learning**: Actively being learned (1-9 reviews)
- **Mastered**: Solid retention (10+ reviews)
- **Overdue**: Words past their review date

### FSRS Performance Metrics

**Algorithm insights**:
- **Average Difficulty**: How challenging your vocabulary is
- **Retention Rate**: Percentage of successful recalls
- **Total Lapses**: Number of forgotten words
- **Accuracy Rate**: Overall answer correctness

### Recent Activity

**Learning timeline**: Recent review sessions and word additions
- **Activity feed**: Chronological list of learning events
- **Performance indicators**: Success rates per session
- **Progress tracking**: See your improvement over time

### Features

- **Real-time updates**: Statistics refresh with new learning data
- **Export capability**: Download your learning data for external analysis
- **Performance insights**: Understand your learning patterns
- **Motivation tracking**: See your vocabulary growth visually

## 🔧 Configuration

### API Keys

**Mistral AI** (Required):
- Get API key from [mistral.ai](https://mistral.ai)
- Add to `src/js/config.js`
- Enables word definitions and examples

**Supabase** (Pre-configured):
- Project URL and API key already set
- Create database table using provided schema
- Enables cloud storage and synchronization

### User Preferences

**Session Size**: Choose 25 or 50 words per exercise
**Exercise Settings**: Preference saved in localStorage

## 🐛 Error Handling

### Network Issues

- **API failures**: Graceful fallback with retry logic
- **Connection problems**: Offline queuing and sync on reconnect
- **Rate limits**: Automatic delays and user feedback

### Data Validation

- **Required fields**: Word and definition must be provided
- **Duplicate prevention**: Smart handling of repeated words
- **Input sanitization**: Basic validation and cleaning

### Recovery Options

- **Refresh page**: Clears temporary state issues
- **Clear cache**: Browser refresh for stuck states
- **Reinstall**: Clean slate for persistent problems

## 📱 Usage Tips

### Effective Learning

1. **Daily practice**: Short, consistent sessions work best
2. **Focus on mistakes**: Learn from incorrect answers
3. **Complete sessions**: Finish exercises for maximum retention
4. **Review regularly**: Let the system guide your schedule

### Building Vocabulary

1. **Start small**: Begin with familiar topics
2. **Batch import**: Use batch lookup for themed word lists
3. **Track progress**: Monitor your growing collection
4. **Set goals**: Aim for consistent daily additions

### Troubleshooting

- **Words not saving**: Check database connection and API keys
- **Exercises not starting**: Ensure minimum 3 saved words
- **Slow performance**: Clear browser cache and check connection
- **Missing features**: Some advanced features are still in development

---

*For technical details, see the [Architecture Overview](../development/architecture.md)*
