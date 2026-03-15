# 🔧 Online Tools Collection

A complete collection of online tools COPIED EXACTLY from Andrea Draghetti for text processing, content generation, data extraction, and cybersecurity tasks. Modern web application built with HTML5, CSS3, and vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Available Tools](#available-tools)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Customization](#customization)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Authors](#authors)

## 🎯 Overview

Online Tools Collection is a single-page web application that provides a suite of useful tools for developers, content creators, and security professionals. The interface is intuitive, responsive, and supports both light and dark mode.

### Why this project?

- **Vanilla JavaScript**: No application framework, lightweight bundle, and easy to maintain
- **Privacy-aware**: Most tools work locally; the QR generator uses an external service
- **Modern interface**: Catalog-style home, light/dark theme, and direct tool navigation
- **Fully responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Open source**: Freely modifiable and customizable

## ✨ Features

### 🎨 Design and UX
- **Theme and Language**: Instant switch between light/dark mode and EN/IT interface
- **Intuitive Interface**: Catalog home, category-based sidebar, and integrated search
- **Responsive Design**: Adaptive layout for all devices
- **Direct Links**: Each tool has a dedicated URL via hash routing
- **Visual Feedback**: Smooth animations and immediate feedback for actions

### 🚀 Performance
- **Fast Loading**: No external library to load
- **Client-Side Processing**: All calculations happen in the browser
- **Memory Optimization**: Efficient resource handling

### 🔒 Privacy and Security
- **Zero Tracking**: No analytics or user tracking
- **Local Data**: Tools work mainly in the browser; the QR generator sends text to a remote provider
- **Open Code**: Completely inspectable and verifiable

## 🛠️ Available Tools

> **27 tools** for developers, content creators, and everyday operational work

### 📝 Text Processing (6 tools)

- **📋 List Generator** - Converts text into formatted lists (numbered, bulleted, comma-separated, pipe-separated)
- **✏️ Add Text to Lines** - Adds prefixes/suffixes to each line
- **🔠 Convert Case** - Transforms text into UPPER, lower, Title, camelCase, snake_case
- **❌ Remove Duplicate Lines** - Removes duplicates with case-sensitive options
- **📏 Remove Line Breaks** - Joins text into a single line
- **🚫 Remove Lines Containing** - Filters lines by specific words

### 🎲 Generators (3 tools)

- **🔑 Password Generator** - Generates secure passwords with the crypto API (8-50 characters)
- **👤 Username Generator** - Creates unique usernames (Random, Tech, Fantasy, Cool)
- **🔢 PIN Generator** - Generates multiple numeric PINs with configurable length and duplicate avoidance

### 🔍 Extraction (2 tools)

- **🌐 Domain Extractor** - Extracts domains from URLs with subdomain handling
- **📧 Email Extractor** - Finds email addresses with advanced patterns

### 📊 Analysis (1 tool)

- **🔢 Count Duplicates** - Analyzes occurrences and frequencies with percentages

### 🔐 Security (3 tools)

- **📜 PEM Certificate Inspector** - Validates PEM input and computes local SHA-256 fingerprints
- **🔒 Password Strength Checker** - Analyzes password strength with 0-8 scoring
- **📱 QR Code Generator/Reader** - Generates QR codes through an external provider and attempts to read images with the browser native APIs

### 🔄 Converters (3 tools)

- **😎 Emoji Shortcode Converter** - Converts between emoji and shortcode
- **🔐 Base64 Encoder/Decoder** - Base64 encode/decode with UTF-8 support
- **🔗 URL Encoder/Decoder** - Encode/decode full URLs or components

### 💻 Development (4 tools)

- **📄 JSON Formatter/Validator** - Formats JSON with customizable indentation
- **🔍 Diff Checker** - Compares texts with ignore case/whitespace options
- **🔤 Regex Tester** - Tests regex with flags and capture groups
- **📋 XML Beautifier** - Formats and validates XML with indentation

### ⚙️ Utilities (5 tools)

- **🎨 Color Picker/Converter** - Converts HEX, RGB, RGBA, HSL with preview
- **🕐 Timestamp Converter** - Converts Unix timestamps and date formats
- **⏱️ TimeConvert** - Converts durations between milliseconds, seconds, minutes, hours, days, and `HH:MM:SS`
- **🧩 Reg2GPO** - Converts Windows `.reg` exports into Group Policy Preferences XML
- **🔏 Hash Generator** - Generates SHA-1, SHA-256, SHA-512 hashes


## 💻 Installation

### Prerequisites
- A local web server (optional for development)
- A modern browser (Chrome, Firefox, Safari, Edge)

### Local Installation

1. **Clone the repository**
```bash
git clone https://github.com/gioxx/tools-collection.git
cd tools-collection
```

2. **Open directly in the browser**
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

3. **Or use a local server** (recommended for development)
```bash
# With Python 3
python -m http.server 8000

# With Node.js
npx serve

# With PHP
php -S localhost:8000
```

4. **Access the application**
   - Open the browser at `http://localhost:8000`

### Docker Compose

You can also run the project with Docker Compose:

```bash
docker compose up --build -d
```

The application will be available at `http://localhost:8080`.

### Custom logo on the home page

The home page can display a custom logo on the right side of the hero if the file `data/logo.png` is available.

- Expected path in the repository: `./data/logo.png`
- Path served inside the container: `/usr/share/nginx/html/data/logo.png`
- If the file does not exist, nothing is shown

#### File permissions

The file must be readable by the web server. In practice, avoid restrictive permissions such as `600`.

Recommended setting:

```bash
chmod 644 data/logo.png
```

## 📖 Usage

### Basic Navigation

1. **Select a tool** from the sidebar on the left
2. **Enter the text** in the input area
3. **Configure the options** if available
4. **Click the button** to process
5. **Copy the result** with the "Copy" button

### Advanced Features

#### 🔍 Tool Search
- Use the search bar in the home catalog or the sidebar to quickly find tools
- The search filters in real time while you type

#### 🌓 Theme Switching
- Click the moon/sun icon to switch between light and dark theme
- The preference is saved locally

#### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus on search
- `Esc`: Close dialogs or reset search

## 📁 Project Structure

```
tools-collection/
│
├── index.html          # Main HTML file with catalog home, sidebar, and tools
├── style.css           # CSS styles with theme support
├── app.js              # JavaScript logic for all tools
├── locales/            # EN/IT translations
├── compose.yaml        # Container startup with Docker Compose
├── CHANGELOG.md        # Project change history
├── README-it.md        # Italian documentation
└── README.md           # English documentation
```

### File Details

#### `index.html`
- Semantic HTML5 structure
- Container for each tool
- Navigation sidebar
- Meta tags for SEO and responsive behavior

#### `style.css`
- CSS variables for themes
- Responsive layout with flexbox/grid
- Animations and transitions
- Reusable component styles

#### `app.js`
- Main `OnlineToolsApp` class
- Modules for each tool
- Event and DOM management
- Shared utility functions

## 🏗️ Architecture

### Design Pattern
The application uses a lightweight MVC pattern:

```javascript
// Model - Data and business logic
class ToolModel {
    processData(input, options) { }
}

// View - User interface
class ToolView {
    render(data) { }
    bindEvents(handler) { }
}

// Controller - Coordination
class ToolController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }
}
```

### Data Flow
1. **User input** → Event Handler
2. **Validation** → Parameter checks
3. **Processing** → Tool logic
4. **Output** → DOM update
5. **Feedback** → User notifications

### State Management
- Local state for each tool
- No shared global state
- Event-driven updates

## 🎨 Customization

### Adding a New Tool

1. **Add HTML** in `index.html`:
```html
<div id="new-tool" class="tool-container">
    <div class="tool-header">
        <h2>🆕 New Tool</h2>
        <p>Tool description</p>
    </div>
    <div class="tool-content">
        <!-- Tool content -->
    </div>
</div>
```

2. **Add link** in the sidebar:
```html
<li>
    <a href="#" data-tool="new-tool" class="tool-link">
        🆕 New Tool
    </a>
</li>
```

3. **Implement logic** in `app.js`:
```javascript
initNewTool() {
    const btn = document.getElementById('newToolBtn');
    btn?.addEventListener('click', () => {
        // Tool logic
    });
}
```

### Customizing Themes

Edit the CSS variables in `style.css`:

```css
:root {
    /* Light theme colors */
    --bg-primary: #ffffff;
    --text-primary: #1a1a1a;
    --accent: #007bff;
}

[data-color-scheme="dark"] {
    /* Dark theme colors */
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
    --accent: #4dabf7;
}
```

### Modifying Layout

The layout uses CSS Grid and Flexbox:

```css
.app-container {
    display: grid;
    grid-template-columns: 280px 1fr; /* Sidebar + Content */
}
```

## 🤝 Contributing

Contributions are welcome! Here is how you can help:

### 1. Fork & Clone
```bash
# Fork on GitHub, then:
git clone https://github.com/gioxx/tools-collection.git
cd tools-collection
git checkout -b feature/new-tool
```

### 2. Develop
- Follow the existing code style
- Test on different browsers
- Make sure it is responsive

### 3. Commit
```bash
git add .
git commit -m "feat: add new tool X"
```

### 4. Push & PR
```bash
git push origin feature/new-tool
# Create Pull Request on GitHub
```

### Guidelines
- **Clean code**: Comments where needed
- **Descriptive names**: Self-explanatory variables and functions
- **Manual testing**: Check all use cases
- **Documentation**: Update the README if needed

## 🗺️ Roadmap

### ✅ Completed
- [X] **27 Available Tools** - Text processing, generators, extraction, development, and utilities
- [X] **Responsive Design** - Mobile-optimized with hamburger menu
- [X] **Theme and Language System** - Dark/light mode and EN/IT interface with persisted preferences
- [X] **Catalog Home and Direct Links** - Initial catalog view and dedicated URLs for tools

### 🔧 In Development
- [ ] API Response Formatter - Formats API responses
- [ ] CRON Expression Builder - Builds cron expressions
- [ ] Lorem Ipsum Generator - Generates placeholder text
- [ ] Favicon Generator - Creates favicons from images

### 🎨 Design & Media 
- [ ] Image Base64 Converter - Converts images to Base64
- [ ] CSS Minifier/Beautifier - Minifies or formats CSS
- [ ] SVG Optimizer - Optimizes SVG code
- [ ] Color Palette Generator - Generates color palettes

### 📱 Mobile & Responsive
- [ ] Device Mockup Generator - Responsive design preview
- [ ] Viewport Size Reference - Common device dimensions
- [ ] Touch Target Checker - Verifies touch dimensions

### ⚡ Miscellaneous Utilities
- [ ] Text Statistics - Counts words, characters, paragraphs
- [ ] Random Data Generator - Generates random data (names, emails, etc.)
- [ ] Unit Converter - Converts measurement units
- [ ] Whitespace Visualizer - Shows invisible spaces

### 🚀 Advanced Features
- [ ] PWA Support - Installable as an app
- [ ] Offline functionality - Works offline
- [ ] Import/Export settings - Save configurations
- [ ] Keyboard shortcuts - Keyboard shortcuts

## 📄 License

This project is released under the MIT license. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Andrea M.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## 👥 Authors

- **Andrea Margiovanni** - *Lead developer* - [@amargiovanni](https://github.com/amargiovanni)
- **Giovanni "Gioxx" Solone** - *Maintenance, bug fixes, Docker, and UX/UI improvements* - [@gioxx](https://github.com/gioxx)

### Acknowledgements

- Native emoji icons for a friendly interface
- Andrea Draghetti, from whom I copied everything
- All contributors and testers (no, come on, Perplexity did everything)

---

<div align="center">
    <p>Made with ❤️ by AI for developers</p>
    <p>
        <a href="https://github.com/gioxx/tools-collection/issues">Report a Bug</a>
        ·
        <a href="https://github.com/gioxx/tools-collection/issues">Request a Feature</a>
    </p>
</div>
