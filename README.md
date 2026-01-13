# LingoDash

An AI-powered vocabulary learning application with word lookup, cloud storage, and exercise features.

[![View Documentation](https://img.shields.io/badge/docs-view-blue)](docs/)

## Quick Start

1. Set up Supabase database (see [Database Setup](docs/setup/database.md))
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Documentation

📖 **[Full Documentation](docs/)** - Complete user guides, setup instructions, and technical documentation

### Key Documentation
- **[Setup Guide](docs/setup/)** - Database setup and configuration
- **[User Guide](docs/user-guide/)** - Features and usage instructions
- **[Development](docs/development/)** - Technical architecture and testing

## Features

- 🔍 **Word Lookup**: Search for word definitions using AI (Mistral API)
- 💾 **Save Words**: Save words with definitions and examples to the cloud
- 📚 **Saved Words**: View your vocabulary collection (synced to cloud)
- 💪 **Exercise Mode**: Test your knowledge with interactive quizzes
- 🎯 **Type-to-Learn**: Practice by typing the correct word
- 🧠 **Spaced Repetition**: Intelligent scheduling prioritizes words you're about to forget
- ☁️ **Cloud Storage**: All your words are saved to Supabase database
- 🔄 **Multi-Device Ready**: Data persists across sessions (authentication optional)

## Tech Stack

- **Vite**: Fast build tool and dev server
- **Vanilla JavaScript**: ES6 modules for clean, modular code
- **Supabase**: Cloud database for word persistence
- **Mistral AI**: API for word definitions

## License

MIT License - see [LICENSE](LICENSE) file for details
