# Online Tools Collection

Static single-page web app with a collection of browser-based utilities for text processing, encoding/decoding, developer workflows, and lightweight security tasks.

## Highlights

- No frontend framework or build step
- Docker-ready with `Dockerfile` and `compose.yaml`
- Theme toggle and language switch (`EN` / `IT`)
- Hash-based routing for direct links to each tool
- Most tools run locally in the browser

## Notes

- The QR generator uses an external provider to render QR images.
- QR image reading depends on native browser support for `BarcodeDetector`.
- JWT inspection decodes tokens and checks time claims, but does not verify signatures.
- PEM certificate inspection currently validates input and computes local SHA-256 fingerprints; full ASN.1 parsing is not implemented.

## Available Tools

### Text Processing

- List Generator
- Add Text to Lines
- Convert Case
- Remove Duplicate Lines
- Remove Line Breaks
- Remove Lines Containing

### Generators

- Password Generator
- Username Generator

### Extraction

- Domain Extractor
- Email Extractor

### Analysis

- Count Duplicates

### Security

- Curl to Burp Converter
- IoC Escape Tool
- JWT Decoder/Inspector
- PEM Certificate Inspector
- Password Strength Checker
- QR Code Generator/Reader

### Converters

- Emoji Shortcode Converter
- Base64 Encoder/Decoder
- URL Encoder/Decoder

### Development

- JSON Formatter/Validator
- Diff Checker
- Regex Tester
- XML Beautifier

### Utilities

- Color Picker/Converter
- Timestamp Converter
- Hash Generator

## Run Locally

### Plain static server

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

### Docker Compose

```bash
docker compose up --build -d
```

Open `http://localhost:8080`.

## Project Structure

```text
tools-collection/
├── app.js
├── compose.yaml
├── Dockerfile
├── index.html
├── locales/
│   ├── en.json
│   └── it.json
├── README-it.md
├── README.md
└── style.css
```

## Internationalization

The UI supports English and Italian through the files in `locales/`. The selected language is stored in `localStorage`.

## License

MIT.
