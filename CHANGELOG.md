# Changelog

All notable changes to this project are documented in this file.

This changelog currently tracks the recent evolution of the project by published commit and keeps the next pending rollout grouped under `Upcoming release`.

## Upcoming release (`1.1.1`)

### Added
- Added `.dockerignore` exclusions for `Dockerfile` and `compose.yaml` so they are not copied into the final production image.
- Added `.github/dependabot.yml` to keep GitHub Actions and Docker base image dependencies updated automatically.
- Added a reusable brand mark component with support for a custom `/data/logo.png` image across the home page and tool sidebar.

### Changed
- Bumped the product version to `1.1.1`.
- Updated the production Docker image build to use a multi-stage Astro static build before serving the compiled `dist/` output with `nginx:alpine`.
- Restored visible version badges in the home header, home footer, tool header, and tool footer using `package.json` as the shared source of truth.
- Restored support for a custom `/data/logo.png` brand image on the home page and next to the app title inside the tool sidebar.
- Made custom logo loading more robust by assigning the image source only after the browser listeners are attached.
- Restored the full search trigger in tool pages so the search field remains visible alongside the `Ctrl/Cmd+K` hint.
- Updated `.github/workflows/dockerbuild.yml` to publish the `tools-collection` image only to GitHub Container Registry (`ghcr.io`).
- Removed Docker Hub-specific authentication and metadata publishing from the image build workflow.

## Published: `b56cdbb` (`v1.0.0`)

### Added
- Rebuilt the project as a static Astro application with Solid.js islands and strict TypeScript.
- Added dedicated per-language pages and per-tool routes for all 27 tools.
- Added a command palette with fuzzy search and keyboard shortcut support.
- Added a GitHub Actions CI workflow for test, build, and source-quality checks.
- Added project governance files including `LICENSE` and `CONTRIBUTING.md`.

### Changed
- Migrated the UI architecture from the legacy monolithic vanilla-JavaScript SPA to modular Astro layouts and Solid components.
- Reworked the homepage and tool layouts with the new design system, localized routing, and shared i18n message catalog.
- Switched the default theme handling to CSS-token based styling aligned with the Astro frontend architecture.

## Published: `05aba28`

### Changed
- Updated the home footer link to point to the upstream project repository.

## Published: `416dc89`

### Changed
- Updated the tool inventory in [README.md](README.md) and [README-it.md](README-it.md) to match the current application.
- Refreshed documentation links to align them with the current project structure and references.

## Published: `b555798`

### Added
- Added a new `Reg2GPO` utility to convert Windows `.reg` exports into Group Policy Preferences XML with paste, upload, copy, and download flows.

### Changed
- Bumped the frontend asset version to `v0.4.5` for the new tool rollout.
- Improved the shared output header layout and monospace input/output styling for converter-heavy tools.

## Published: `a1640f5`

### Changed
- Documented custom logo setup requirements and file permissions in [README.md](README.md) and [README-it.md](README-it.md).

## Published: `ff96af8`

### Added
- Added a `PIN Generator` utility.
- Added a `TimeConvert` utility for converting milliseconds, seconds, minutes, hours, and days, including `HH:MM:SS` formatting.

### Changed
- Reworked the password generator options layout for a cleaner two-column arrangement with improved mobile behavior.

## Published: `02141ec`

### Added
- Added support for a custom home hero logo loaded from the local `data/` directory.
- Added a branded footer area to the home view with project ownership and repository links.
- Added `data/.gitkeep` so the customization directory is preserved in the repository.

### Changed
- Aligned [README.md](README.md) to [README-it.md](README-it.md) as a faithful English translation of the Italian source document.
- Refined the home hero layout and related responsive styling for custom branding.
- Updated `compose.yaml` to include the local `data/` mount used for customization assets.

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
