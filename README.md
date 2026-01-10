# LingoDash

A simple, elegant web application that provides instant word definitions using Mistral AI.

## 🚀 Features

- Clean, modern UI with gradient background
- Centered text input with smooth animations
- **AI-powered word definitions** using Mistral AI
- Real-time definition lookup with debouncing
- Responsive design
- Pure HTML, CSS, and JavaScript (no dependencies)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lingodash.git
cd lingodash
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

## 🛠️ Usage

1. Type any word into the text input box
2. Wait 800ms or press Enter
3. The app will fetch and display a definition using Mistral AI
4. The definition appears below the input box with a clean, readable format

**Note:** The app uses debouncing to avoid excessive API calls while you're typing.

## 📁 Project Structure

```
lingodash/
├── index.html      # Main HTML file
├── style.css       # Styling
├── main.js         # JavaScript with Mistral AI integration
├── package.json    # Dependencies and scripts
├── LICENSE         # MIT License
└── README.md       # Project documentation
```

## 🎨 Customization

All styles are embedded in the `<style>` tag within `index.html`. You can easily customize:
- Colors and gradients
- Input box size and styling
- Fonts and typography
- Animations and transitions

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)

## ⭐ Show your support

Give a ⭐️ if you like this project!
