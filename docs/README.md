# LingoDash Documentation

An AI-powered vocabulary learning application with word lookup, cloud storage, and exercise features.

## 📖 Table of Contents

### 🚀 Getting Started
- **[Quick Start](setup/quickstart.md)** - Step-by-step setup guide
- **[Database Setup](setup/database.md)** - Supabase configuration

### 📚 User Guide
- **[Features Overview](user-guide/features.md)** - Complete feature documentation
- **[Learning System](user-guide/learning-system.md)** - How spaced repetition works
- **[User Flows](user-guide/user-flows.md)** - Detailed interaction analysis

### 🛠️ Development
- **[Architecture](development/architecture.md)** - Technical analysis & code quality
- **[Testing](development/testing.md)** - Test specifications & coverage
- **[API Reference](development/api.md)** - API documentation

### 💡 Future Ideas
- **[Feature Roadmap](ideas.md)** - Planned enhancements & improvements

## Features

- 🔐 **User Authentication**: Secure sign up and sign in with Supabase Auth
- 🔍 **Word Lookup**: Search for word definitions using AI (Mistral API)
- 💾 **Save Words**: Save words with definitions and examples to the cloud
- 📚 **Saved Words**: View your vocabulary collection (synced to cloud)
- 💪 **Exercise Mode**: Test your knowledge with interactive quizzes
- 🎯 **Type-to-Learn**: Practice by typing the correct word
- 🧠 **Spaced Repetition**: Intelligent scheduling prioritizes words you're about to forget
- 📊 **Learning Analytics**: Track progress with detailed statistics and charts
- ☁️ **Cloud Storage**: All your words are saved to Supabase database
- 🔄 **Multi-Device Ready**: Data persists across sessions and devices

## Tech Stack

- **Vite**: Fast build tool and dev server
- **Vanilla JavaScript**: ES6 modules for clean, modular code
- **Supabase**: Cloud database for word persistence
- **Mistral AI**: API for word definitions and examples

## Project Structure

```
lingodash/
├── index.html              # Main HTML file with 4-tab interface
├── src/
│   ├── main.js             # App entry point & initialization
│   ├── css/
│   │   └── style.css       # Application styles
│   └── js/
│       ├── api.js          # Mistral AI integration
│       ├── auth.js         # Supabase authentication
│       ├── authUI.js       # Authentication UI components
│       ├── config.js       # API configuration
│       ├── fsrs.js         # Spaced repetition algorithm
│       ├── lookup.js       # Word lookup functionality
│       ├── supabase.js     # Supabase client setup
│       ├── algorithms/     # Algorithm implementations
│       ├── core/           # Core application logic
│       ├── exercise/       # Exercise system (quiz, session, progress)
│       ├── features/       # Feature modules (auth, exercise, lookup, etc.)
│       ├── modules/        # Modular components
│       ├── stats/          # Statistics and analytics
│       ├── storage/        # Data persistence (CRUD, export, review)
│       ├── ui/             # UI components (tabs, modals, validation)
│       └── utils/          # Utility functions
├── docs/                   # 📖 Documentation
│   ├── setup/             # Setup guides
│   ├── user-guide/        # User documentation
│   └── development/       # Technical docs
├── SUPABASE_SCHEMA.sql     # Database schema
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies
```

## Getting Started

⚠️ **IMPORTANT**: You must set up the Supabase database before running the app!

### 1. Set Up Supabase Database

See **[Database Setup](setup/database.md)** for step-by-step instructions.

Quick steps:
1. Go to Supabase dashboard: https://yjlsfkhtulxmpdpihgpz.supabase.co
2. Open SQL Editor
3. Run the SQL code from `SUPABASE_SCHEMA.sql`
4. Verify the `words` table was created

### 2. Installation

```bash
npm install
```

### 3. Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with UI
npm run test:perf     # Run performance tests
npm run coverage      # Generate coverage report
```

## Usage

1. **Authentication**: Create an account or sign in with your email and password
2. **Word Lookup** (🔍 tab): Type a word and press Enter to get AI-powered definitions
3. **Save Words**: Click the "💾 Save Word" button to add words to your cloud collection
4. **View Saved Words** (📚 tab): Browse your vocabulary with filtering and pagination
5. **Practice** (💪 Exercise tab): Test your knowledge with spaced repetition quizzes
   - The system uses **spaced repetition** to prioritize words that need review
   - Each word shows a **compact due date badge** (−3d = overdue, Today, +7d = due in 7 days)
   - **Minimalist interface**: Clean, distraction-free learning experience
   - **Persistent learning**: Words answered incorrectly reappear in the same session until mastered
   - Session ends only when all words are answered correctly at least once
   - Successfully learned words appear at increasing intervals (1 day → 3 days → 1 week → etc.)
6. **Track Progress** (📊 Stats tab): View learning analytics, progress charts, and performance metrics

## Configuration

### Supabase (Required)
The app uses Supabase for cloud storage. Configuration is in `src/js/supabase.js`:
- Project URL: `https://yjlsfkhtulxmpdpihgpz.supabase.co`
- API Key: Already configured

**You must create the database table first!** See [Database Setup](setup/database.md)

### Mistral AI API (Required)
The app uses Mistral AI for word definitions. API key is in `src/js/config.js`:

```javascript
export const MISTRAL_API_KEY = 'your-api-key-here';
```

## License

MIT License - see LICENSE file for details
