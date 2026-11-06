# 0004 — Self-host web fonts; no third-party font host

**Status**: Proposed
**Date**: 2026-11-06

## Context

Every page imported its fonts (Inter, Space Grotesk, JetBrains Mono) from
Google Fonts: `src/styles/global.css` started with an `@import` of
`fonts.googleapis.com`, and the CSP allowed `fonts.googleapis.com` (style-src)
and `fonts.gstatic.com` (font-src). The GitHub Pages landing (`docs/index.html`)
did the same.

Each page view therefore sent the visitor's IP address and user agent to
Google. An IP address is personal data (CJEU C-582/14, *Breyer*); a German court
held this exact use of Google Fonts unlawful without consent (LG München I,
3 O 17493/20, 20 January 2022). It also breaks the repository's own rule that
nothing leaves the visitor's browser, and the dossier's claim that no user data
is transmitted. The issue was found on 2026-11-06 while preparing the PDF
manual, which needs the same font files locally.

## Decision

Serve the three families from the site itself: the unmodified variable-weight
woff2 subsets (latin, latin-ext) in `public/fonts/`, declared with `@font-face`
and `unicode-range` in `global.css`. Remove both Google hosts from the CSP so
that a reintroduced third-party font request is blocked by the browser.

The files come from Fontsource (pinned versions and SHA-256 sums in
`public/licenses/fonts/NOTICE.txt`); the SIL OFL 1.1 texts ship next to them.

## Alternatives considered

- **Keep Google Fonts, add a consent banner** — consent for a font is
  disproportionate and the site has no consent mechanism; rejected.
- **System font stack only** — no transfer at all, but changes the visual
  identity of the site and of the PDF manual; rejected.
- **`@fontsource-variable/*` npm packages** — same files, but adds three
  runtime dependencies for static assets; rejected.

## Consequences

- No request leaves the origin when a page loads, apart from the Cloudflare
  Web Analytics beacon (cookieless, unchanged). `e2e/privacy.spec.ts` fails if
  a page→page navigation requests any other host, if the CSP names a Google
  font host, or if a self-hosted family fails to load.
- About 230 KB of woff2 is served from the site (latin subsets load only when
  their characters appear).
- Font updates are manual: replace the files and the sums in the NOTICE.
