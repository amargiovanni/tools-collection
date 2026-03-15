# Changelog

All notable changes to this project are documented in this file.

This changelog currently tracks the recent evolution of the project by published commit and keeps local, not-yet-pushed work under `Unreleased`.

## Unreleased

### Added
- Added a new `Reg2GPO` utility to convert Windows `.reg` exports into Group Policy Preferences XML with paste, upload, copy, and download flows.

### Changed
- Aligned [README.md](README.md) to [README-it.md](README-it.md) as a faithful English translation of the Italian source document.
- Bumped the frontend asset version to `v0.4.5` for the new tool rollout.

## Published: `f3d17f2`

### Changed
- Added a search box to the home catalog.
- Synchronized search filtering between the home catalog and the sidebar.
- Updated the home card grid so cards keep a fixed visual width instead of stretching across incomplete rows.

## Published: `b23992a`

### Fixed
- Corrected a JavaScript parsing error that stopped the frontend from initializing.
- Added asset versioning for `app.js`, `style.css`, `favicon.svg`, and locale files to reduce stale-cache issues during container rebuilds.

## Published: `10a9b55`

### Added
- Added a visible UI version badge in the top-right controls to verify which frontend build is being served.

## Published: `7a08e2d`

### Fixed
- Hardened application bootstrap so initialization still runs when `DOMContentLoaded` timing would otherwise prevent startup.

## Published: `c77fb71`

### Fixed
- Corrected the initial home view state so the app no longer started with the first tool visibly active in the markup.

## Published: `6abde49`

### Added
- Added a catalog-style home view with grouped tool cards.
- Added a dedicated home button near the global language and theme controls.

### Changed
- Moved global controls out of the sidebar and into a shared top-right control area.
- Simplified the favicon to use the wrench emoji directly.

## Published: `0686968`

### Added
- Added `CHANGELOG.md` to keep track of project changes over time.

### Changed
- Improved spacing and vertical rhythm across several tool panels.
- Added `Copy All` to the username generator results.
- Reworked the password generator layout so all options are grouped more consistently.
- Extended the password generator to create multiple passwords at once, with per-item copy and `Copy All`.

### Removed
- Removed `Curl to Burp Converter` from the UI, routing, and translations.
- Removed `IoC Escape Tool` from the UI, routing, and translations.
- Removed `JWT Decoder/Inspector` from the UI, routing, and translations.

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
