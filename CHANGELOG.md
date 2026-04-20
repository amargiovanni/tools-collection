# Changelog

All notable changes to this project are documented in this file.

This changelog tracks the recent evolution of the project by published release and notable published commits.

## Unreleased

### Added
- Added an `AES Key Generator` tool for browser-side generation of AES-128, AES-192, and AES-256 keys in hex and Base64.
- Added browser-safe generators for API keys, JWT secrets, HMAC keys, salts, recovery codes, passphrases, and random strings.

### Changed
- Clarified the `Color Picker/Converter` input hints so it is explicit that the field accepts HEX, RGB, RGBA, HSL, and HSLA values.
- Improved the color parser so HSL and RGBA inputs are accepted directly.

## Published: `1.4.1`

### Changed
- Bumped the product version to `1.4.1`.
- Refreshed the Node/Vitest toolchain and Docker build action through Dependabot updates.

## Published: `1.4.0`

### Added
- Added shared `useToolState()` hook to eliminate state save/restore boilerplate across all 36 tool components.
- Added shared `validateNonEmpty()` utility for standardized input validation across 19 tool logic modules.
- Added ~130 new Playwright E2E tests (357 total) covering option toggles, value verification, edge cases, unicode, boundary conditions, and multi-mode interactions for every tool.
- Added missing `rclone-password.spec.ts` E2E test file.

### Changed
- Bumped the product version to `1.4.0`.
- Replaced 10 duplicate language page files with 2 Astro dynamic routes using `getStaticPaths()`, reducing page boilerplate by ~116 lines.
- Extracted 460 lines of locale data from `CronExpression.tsx` into `src/components/tools/cron/CronPhrases.ts`, reducing the component from 1172 to 707 lines.
- Converted `cards()` pattern from plain functions to `createMemo` in 5 components (DataSizeConverter, ColorPicker, HashGenerator, TimeConvert, TimestampConverter).
- Converted `parsed()`/`expiry()` from plain functions to `createMemo` in CsvViewer and JwtDecoder.
- Replaced `createEffect` with `createMemo` in PasswordStrength for synchronous derived state.
- Migrated all 36 tool components from manual `onMount`/`onCleanup` boilerplate to the shared `useToolState()` hook (net removal of ~248 lines).
- Migrated 19 tool logic files from inline empty-input checks to the shared `validateNonEmpty()` utility.

### Performance
- Replaced O(n*m) `split().join()` loop in emoji-shortcode with single-pass regex replacement.

## Published: `1.3.5`

### Added
- Extended the `Cron Expression Parser` with AWS-style 6-field parsing, `cron(...)` wrapper support, and special tokens like `?`, `L`, `W`, and `#`.
- Added bidirectional Unix/AWS conversion plus upcoming and previous schedule previews for cron expressions.

### Changed
- Bumped the product version to `1.3.5`.
- Updated the README files to describe the new cron capabilities in the latest release note blurb.

### Fixed
- Fixed cron expression validation, conversion, and schedule-evaluator edge cases uncovered during review.

## Published: `1.3.4`

### Added
- Added a new `Rclone Password Revealer` tool for revealing passwords stored in rclone's obscured Base64URL format.

### Changed
- Bumped the product version to `1.3.4`.
- Updated the README files to describe the catalog as containing more than 30 tools instead of a fixed count.

## Published: `1.3.3`

### Added
- Added a new `Text Counter` tool modeled on `contacaratteri.it`, with live counts for characters, words, sentences, paragraphs, reading/speaking time, top keywords, and quick text actions.
- Added a new `BitTorrent Magnet Link Generator` tool for building magnet URIs from an info hash, optional resource name, and tracker list.
- Added unit and Playwright end-to-end coverage for the new magnet generator workflow.
- Added a new `Cron Expression Parser` tool that explains standard 5-field cron schedules plus common shortcuts like `@daily` and `@reboot`.
- Added an assisted cron builder with clickable schedule presets and field selectors to compose cron expressions visually.
- Added a new `Data Size Converter` tool with bit/byte conversion and support for `KB/MB/GB/TB` plus `KiB/MiB/GiB/TiB`.
- Added Spanish, French, and German translations (382 keys each) with full i18n support for 5 languages.
- Added a language switcher dropdown menu replacing the single-language toggle, showing all available languages.
- Added Playwright end-to-end browser tests covering the tool catalog and cross-site navigation.
- Added `data-testid` attributes to shared UI components for stable e2e test selectors.
- Added shared `ResultCard` component used by HashGenerator, TimestampConverter, TimeConvert, and ColorPicker.
- Added `translateError()` helper with dedicated unit tests for localized error messages.
- Added SolidJS component testing infrastructure (`@solidjs/testing-library`, `jsdom`).

### Changed
- Bumped the product version to `1.3.3`.
- Updated the password generator with a Nebula.Tools-aligned `Simple mode` for reduced special characters plus a separate `Avoid ambiguous characters` option that `Simple mode` enables by default.
- Updated catalog metadata, lazy tool loading, translations, and automated tests to account for the new tool count.
- Replaced eager static imports of all 29 tool components with SolidJS `lazy()` dynamic imports for code splitting (44 separate JS chunks instead of 1 monolithic bundle).
- Replaced `getAlternateLanguage()` with `getOtherLanguages()` to support 5 languages.
- Updated root redirect and hash redirect scripts to recognize all 5 supported languages.
- Updated `hreflang` alternate links in `BaseLayout` to include all 5 languages.
- Updated Docker `default-language.sh` to accept `es`, `fr`, and `de` in addition to `en` and `it`.
- Updated CI workflow to run Playwright e2e tests after build and verify the generated page output.
- Hoisted regex patterns to module scope in `xml-beautifier`, `reg2gpo`, and `email-extractor` for better performance.
- Batched `crypto.getRandomValues()` calls in password and PIN generators instead of one syscall per character.
- Extracted `isValidRgb()` helper in `color-picker` to deduplicate RGB range validation.
- Removed redundant `valid` signal from `JsonFormatter` and `XmlBeautifier` (derived from output state).
- Set minimum `font-size: 16px` on all input elements to prevent iOS auto-zoom on focus.
- Updated docs and tests to reflect the new tool count and dynamic catalog totals.

### Fixed
- Fixed data-size conversion semantics to follow base 1024 for `KB/MB/GB/TB` (common IT usage), so `4 GB = 4096 MB`.
- Fixed 7 components bypassing `translateError()` and showing raw English error messages to Italian (and now all non-English) users.
- Fixed hardcoded English strings in `JsonFormatter`, `XmlBeautifier`, and `PemInspector` that were not using i18n keys.
- Fixed `QrCode` component re-implementing functions already exported from `qr-code.ts`.

### Removed
- Removed legacy monolithic SPA files (`index.html`, `app.js`, `style.css`, `locales/`) — ~236KB of dead code.
- Removed unused `toast.tsx` component.

## Published: `1.1.1`

### Added
- Added `.dockerignore` exclusions for `Dockerfile` and `compose.yaml` so they are not copied into the final production image.
- Added `.github/dependabot.yml` to keep npm packages, GitHub Actions, and Docker base image dependencies updated automatically.
- Added a reusable brand mark component with support for a custom `/data/logo.png` image across the home page and tool sidebar.
- Added Docker runtime support for configuring the default application language through `DEFAULT_LANGUAGE`.

### Changed
- Bumped the product version to `1.1.1`.
- Updated the production Docker image build to use a multi-stage Astro static build before serving the compiled `dist/` output with `nginx:alpine`.
- Switched the Docker build stage to `node:24-alpine` and limited published image architectures to `linux/amd64` and `linux/arm64` because `node:25-alpine` does not provide `linux/arm/v7` manifests.
- Restored visible version badges in the home header, home footer, tool header, and tool footer using `package.json` as the shared source of truth.
- Restored support for a custom `/data/logo.png` brand image on the home page and next to the app title inside the tool sidebar.
- Made custom logo loading more robust by assigning the image source only after the browser listeners are attached.
- Refined the custom logo presentation so user-provided branding is shown without the fallback logo tile framing.
- Restored the full search trigger in tool pages so the search field remains visible alongside the `Ctrl/Cmd+K` hint.
- Updated `.github/workflows/dockerbuild.yml` to publish the `tools-collection` image only to GitHub Container Registry (`ghcr.io`).
- Removed Docker Hub-specific authentication and metadata publishing from the image build workflow.
- Realigned `README.md` and `README-it.md` so both documents describe the current Astro-based project and custom logo setup consistently.

### Fixed
- Added trailing slashes to generated tool URLs to avoid incorrect Nginx redirects that could drop non-default ports such as `:8080` in container deployments.
- Marked the runtime `default-language.js` include as inline in Astro pages so production Docker builds no longer fail during asset bundling.

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
