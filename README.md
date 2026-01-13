# LingoDash

An AI-powered vocabulary learning application with authentication, word lookup, spaced repetition exercises, and learning analytics.

[![View Documentation](https://img.shields.io/badge/docs-view-blue)](docs/)

## Quick Start

1. Set up Supabase database (see [Database Setup](docs/setup/database.md))
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Create an account or sign in to start learning

## Documentation

📖 **[Full Documentation](docs/)** - Complete user guides, setup instructions, and technical documentation

### Key Documentation
- **[Setup Guide](docs/setup/)** - Database setup and configuration
- **[User Guide](docs/user-guide/)** - Features and usage instructions
- **[Development](docs/development/)** - Technical architecture and testing

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
- **Supabase**: Cloud database for word persistence and authentication
- **Mistral AI**: API for word definitions and examples

## Usage

1. **Authentication**: Create an account or sign in with your email and password
2. **Word Lookup** (🔍 tab): Search for word definitions using AI-powered lookup
3. **Save Words** (💾 button): Add words with definitions and examples to your collection
4. **View Saved Words** (📚 tab): Browse your vocabulary with filtering and pagination
5. **Practice** (💪 Exercise tab): Test your knowledge with spaced repetition quizzes
6. **Track Progress** (📊 Stats tab): View learning analytics and performance metrics

## License

MIT License - see [LICENSE](LICENSE) file for details
