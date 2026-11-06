# Dependency wave (Nov 2026) + PDF user manual

Scope decisions (Andrea, 2026-11-06):
- Manual language: English only, one PDF linked from every locale
- Depth: compact catalogue — cover, intro, contents, half a page per tool with a
  real screenshot (~30 pages)
- Fonts: official OFL woff2 files (Inter, Space Grotesk, JetBrains Mono) copied
  into the manual source with their licences; no npm package
- Download links: footer of every page, home, and each tool page (deep link to
  that tool's page in the PDF)

## Part A — Dependencies

- [x] A0. `tasks/` is git-ignored, which contradicts the rule that step docs are
      versioned. Un-ignore `tasks/` and commit `todo.md`, `lessons.md` and the
      `archive/` folder (separate `chore` commit)
- [x] A1. Bring #152 (`chore/deps-batch-2026-11`) up to date with main (merge,
      no local lockfile rewrite); check the merged lockfile still has heic-to
      and that no platform-specific entries were dropped (lessons rule 2.1)
- [x] A2. Reproduce the 16 `tests/lib/favorites.test.ts` failures under local
      Node; find the cause (systematic-debugging), fix it with a test that
      fails first. Separate `fix` PR if it is unrelated to the bumps
- [x] A3. Local verification on #152: `npm ci` (no lockfile rewrite), `npm test`,
      `npm run check`, `npm run build`, `npm run test:e2e` — output shown
- [x] A4. Merge #152 after green CI; close #131 #132 #133 #135 #139–#144 as
      superseded; delete the ~20 stale merged/superseded dependabot branches
- [x] A5. Verify main CI green and one home→tool navigation on the live site

## Part B — PDF manual

Structure (follows `stringadvice/docs/handouts`, no npm packages):
- `docs/manual/` — `manual.html`, `print.css`, `fonts/` (+ OFL licences),
  `screens/`, `build.mjs`, `tools/render-preview.swift`
- Content is generated from `src/config/tools.ts` + `src/i18n/messages/en.json`
  (names, descriptions) so the manual cannot drift from the catalogue; a short
  hand-written "how to use" line per tool lives in `docs/manual/content.json`
- Output: `public/manual/tools-collection-manual.pdf` +
  `src/config/manual-pages.json` (tool id → PDF page), committed

- [x] B1. Design pass (frontend-design): cover, intro, category dividers, tool
      cards. Identity from the site's "workshop" design (palette tokens of
      `global.css`, Space Grotesk / Inter / JetBrains Mono, category tints).
      Opaque colours only: no box-shadow, rgba, opacity, color-mix, mask,
      transparent gradient stops, SVG data-URI icons
- [x] B2. `build.mjs screens`: run `astro preview` on the built site, drive the
      local Chrome over DevTools, one screenshot per tool in a filled-in state
      (light theme, 2x)
- [x] B3. `build.mjs pdf`: assemble HTML, guard against overflow (assertFitsPage),
      print with tagged PDF + outline, own metadata, refuse transparency
      (assertOpaque), compute tool → page map by reading each page's text
      (`pdftotext`), write `manual-pages.json`
- [x] B4. Inspect every page rendered by PDFKit (`render-preview.swift`), not
      pdftoppm; iterate on the design until it is right
- [x] B5. UI: "User manual (PDF)" link in the home footer, a card/button in the
      home, and on each tool page a link to `…pdf#page=N`; i18n keys in all 5
      locales ("English" noted, `hreflang="en"`, `type="application/pdf"`, size)
- [x] B6. Tests: unit test that every tool in the registry has a page in
      `manual-pages.json` (catches a stale manual); e2e that the footer/home/tool
      links exist and the PDF is served (200, `application/pdf`); a11y scan stays
      clean on touched routes
- [x] B7. README/README-it mention, CHANGELOG, `npm test` + `check` + `build` +
      e2e green with output shown; PR to main (feature branch), CI green, merge
- [x] B8. After deploy: download the PDF from the live site, check one tool
      deep link opens the right page

Compliance notes: the PDF is a static same-origin asset — nothing leaves the
browser, CSP unchanged. Font licences (OFL) shipped next to the fonts and listed
in the manual's colophon. No ADR needed (no architectural or compliance decision).

## Part C — Release (Andrea: "go straight to release", 2026-11-06)

- [x] C1. Version bump (minor: new user-facing manual) + CHANGELOG
- [x] C2. cra-evidence W2: SBOM, scan, supply-chain diff vs 1.7.2, triage
- [x] C3. Tag, GitHub release with artifacts (incl. the PDF), container SBOM
- [x] C4. Live-site check: home→tool navigation, PDF download, deep link

## Review

Outcome (2026-11-06):
- A: deps batch #152 (merged by gioxx before its last push; the Playwright fix
  re-landed as #157), Node 26 localStorage fix #154, TS 7 type errors + CI
  type-check #155, tasks/ versioned #153. Stale dependabot PRs/branches closed.
- Found on the way and fixed, each with a test written first:
  - **privacy vulnerability**: Google Fonts sent visitor IPs to Google → #156 (ADR 0004)
  - **privacy vulnerability**: Share put tool input in `?s=` → #158 (ADR 0005)
  - QR PNG download and URL decode bugs → #159 (found by the manual fact-check)
  - default-language.js 404 on Pages → #163; home label-in-name (axe 4.14) → #164
  - 27 npm advisories incl. a Critical in astro → #162 (lockfile via Linux npm 10;
    lessons.md rule 2.3)
- B: manual #161 (38 pages; 26/54 tool sentences corrected by the fact-check;
  domain removed on Andrea's request, guard against external links).
- C: v1.8.0 evidence: 26 Go findings in tsgo (dev-only) → ADR 0006 Proposed;
  ADR 0002's time box had lapsed on 2026-09-07 unnoticed.
- Open for the maintainer: decide ADRs 0003–0006; approve the dossier row;
  Cloudflare injects a bot-detection inline script the CSP blocks on every
  page (dashboard setting, not code); manual a11y checks still not verified.
- Live check after release (2026-11-06): v1.8.0 served; home → Base64 via the
  client router hydrates (~1.2 s) and works; PDF 200 application/pdf; tool deep
  link `#page=25` matches the map; only third-party host is the Cloudflare
  analytics beacon; the only CSP-blocked inline script is Cloudflare's injected
  bot-detection snippet. Container v1.8.0: attestation verified, 1 CVE left.


# Code scanning alerts (2026-11-06)

Triage of the 8 open CodeQL alerts on BuildBandits/tools-collection.

- [x] #3–#7 `js/incomplete-sanitization` in `src/tools/docker-run-to-compose.ts`
      — real defect. YAML quoting escaped `"` but not `\`: `C:\Users\app`
      came back as `C:\Users<BEL>pp`, `C:\Users` made the YAML unparseable
      (`\U`), and a trailing `\` broke out of the scalar. Fix: `yamlQuoted`
      is `JSON.stringify` (a JSON string is a valid YAML double-quoted
      scalar), used by every quoted emitter.
- [x] #7 `shellQuote` (Compose → docker run) wrapped values in double quotes,
      so `$(...)`, backticks and `$VAR` in a Compose value were expanded by the
      shell when the generated command was pasted. Fix: POSIX single quotes,
      `'` written as `'\''`. Verified by running the output through `sh`.
- [x] #1, #2 `actions/missing-workflow-permissions` in `ci.yml` — workflow-level
      `permissions: contents: read`; no job pushes, comments or writes.
- [x] #8 `js/incomplete-url-substring-sanitization` in
      `e2e/tools/domain-extractor.spec.ts:65` — false positive: a test filter
      on output lines, not a sanitizer. Dismissed as "used in tests"
      (approved by Andrea, 2026-11-06).

Impact note: everything runs in the visitor's browser and the input is the
visitor's own, so no third party can exploit it; the shell case still made the
tool emit a command that did something other than what it showed, which is
why it is treated as a vulnerability and stated in the PR.

Unrelated, flagged: `npm run check` (`astro check`) refuses TypeScript 7.0.2;
CI uses `tsc --noEmit`, which is clean.
