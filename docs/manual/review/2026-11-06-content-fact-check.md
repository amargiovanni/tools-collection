# Manual content fact-check — 2026-11-06

Each `use` sentence in `docs/manual/content.json` was checked by a read-only
subagent against the tool's component (`src/components/tools/*.tsx`), its logic
(`src/tools/*.ts`) and the English UI labels (`src/i18n/messages/en.json`).

Result: 28 of 54 accurate; 17 wrong, 9 incomplete — all 26 rewritten with the
corrected sentences (plus heic-to-jpg reworded to "EXIF metadata is not kept",
which matches the tool's own notice; no test proves EXIF removal).

Wrong claims removed: kebab-case (convert-case), comma replacement
(remove-line-breaks), "natural" sort (sort-text), SHA-384 (hash-generator),
subject/issuer/validity (pem-inspector), HS256/384/512 choice
(jwt-secret-generator), base-1000 units (data-size-converter), weeks
(time-convert), error position (json-formatter), "validate" action
(yaml/toml-formatter), "issued at" display (jwt-decoder), print feature
(recovery-code-generator), "never leaves the page" (password-strength),
side-by-side editor and Copy HTML (markdown-to-html), case-sensitivity default
(remove-duplicate-lines), QR download as a highlight (qr-code).

## Findings outside the manual

| Finding | Kind | Handling |
|---|---|---|
| Share puts tool state (passwords, tokens, any input) in the `?s=` query string, sent to the host when the link is opened | Vulnerability (privacy) | Reported to the maintainer; fixed in its own PR (state moved to the `#` fragment) |
| QR code "Download PNG" saves the text of an SVG data URL as `qrcode.png` | Bug | Fixed in its own PR with a test |
| URL encoder "Decode URL" uses `decodeURI`, leaving `%2F %3F %26 %3D` encoded | Bug | Fixed in its own PR with a test |
| JSON formatter's translated error hides the parser's position | UX gap | Flagged, not in this release |
