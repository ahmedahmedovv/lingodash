# LingoDash

An AI-powered vocabulary learning application with word lookup, saving, and exercise features.

## Features

- 🔍 **Word Lookup**: Search for word definitions using AI (Mistral API)
- 💾 **Save Words**: Manually save words with definitions and examples
- 📚 **Saved Words**: View your vocabulary collection
- 💪 **Exercise Mode**: Test your knowledge with interactive quizzes
- 🎯 **Type-to-Learn**: Practice by typing the correct word

## Tech Stack

- **Vite**: Fast build tool and dev server
- **Vanilla JavaScript**: ES6 modules for clean, modular code
- **LocalStorage**: Client-side word persistence
- **Mistral AI**: API for word definitions and examples

## Project Structure

```
lingodash/
├── index.html          # Main HTML file
├── src/
│   ├── main.js         # App entry point
│   ├── css/
│   │   └── style.css   # Styles
│   └── js/
│       ├── api.js      # API calls
│       ├── config.js   # Configuration
│       ├── exercise.js # Exercise functionality
│       ├── lookup.js   # Word lookup
│       ├── storage.js  # LocalStorage operations
│       └── ui.js       # UI components
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## Getting Started

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

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
npm run coverage      # Generate coverage report
```

See [TEST_GUIDE.md](./TEST_GUIDE.md) for detailed testing documentation.

## Usage

1. **Look Up Words**: Type a word and press Enter to get its definition
2. **Save Words**: Click the "💾 Save Word" button to add it to your vocabulary
3. **View Saved Words**: Switch to the "📚 Saved Words" tab
4. **Practice**: Go to "💪 Exercise" tab and test your knowledge

## API Configuration

The app uses Mistral AI API. Update your API key in `src/js/config.js`:

```javascript
export const MISTRAL_API_KEY = 'your-api-key-here';
```

## License

MIT License - see LICENSE file for details
