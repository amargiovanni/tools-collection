# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Changed
- Improved spacing and vertical rhythm across several tool panels.
- Added `Copy All` to the username generator results.
- Reworked the password generator layout so all options live in a single, more consistent settings area.
- Extended the password generator to create multiple passwords at once, with per-item copy and `Copy All`.

### Removed
- Removed `Curl to Burp Converter` from the UI, routing, and translations.
- Removed `IoC Escape Tool` from the UI, routing, and translations.
- Removed `JWT Decoder/Inspector` from the UI, routing, and translations.

### Added
- Added this `CHANGELOG.md` to keep track of functional and UI updates over time.

## Published: `6e400b4`

### Changed
- Completed the English and Italian UI translations across the application.
- Split the documentation into an English [README.md](README.md) and an Italian [README-it.md](README-it.md).

## Published: `5960813`

### Changed
- Fixed multiple functional issues across the tools collection.
- Improved sidebar controls and layout, including language and theme toggle positioning.
- Hardened several tool implementations and aligned documentation with actual behavior.

## Published: `b8a1db7`

### Added
- Added `compose.yaml` for local containerized deployment.
- Added a language toggle with EN/IT support and persisted language preference.
- Added hash-based routing so each tool can be linked directly with its own URL fragment.
