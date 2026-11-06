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
- [ ] A1. Bring #152 (`chore/deps-batch-2026-11`) up to date with main (merge,
      no local lockfile rewrite); check the merged lockfile still has heic-to
      and that no platform-specific entries were dropped (lessons rule 2.1)
- [ ] A2. Reproduce the 16 `tests/lib/favorites.test.ts` failures under local
      Node; find the cause (systematic-debugging), fix it with a test that
      fails first. Separate `fix` PR if it is unrelated to the bumps
- [ ] A3. Local verification on #152: `npm ci` (no lockfile rewrite), `npm test`,
      `npm run check`, `npm run build`, `npm run test:e2e` — output shown
- [ ] A4. Merge #152 after green CI; close #131 #132 #133 #135 #139–#144 as
      superseded; delete the ~20 stale merged/superseded dependabot branches
- [ ] A5. Verify main CI green and one home→tool navigation on the live site

## Part B — PDF manual

Structure (follows `stringadvice/docs/handouts`, no npm packages):
- `docs/manual/` — `manual.html`, `print.css`, `fonts/` (+ OFL licences),
  `screens/`, `build.mjs`, `tools/render-preview.swift`
- Content is generated from `src/config/tools.ts` + `src/i18n/messages/en.json`
  (names, descriptions) so the manual cannot drift from the catalogue; a short
  hand-written "how to use" line per tool lives in `docs/manual/content.json`
- Output: `public/manual/tools-collection-manual.pdf` +
  `src/config/manual-pages.json` (tool id → PDF page), committed

- [ ] B1. Design pass (frontend-design): cover, intro, category dividers, tool
      cards. Identity from the site's "workshop" design (palette tokens of
      `global.css`, Space Grotesk / Inter / JetBrains Mono, category tints).
      Opaque colours only: no box-shadow, rgba, opacity, color-mix, mask,
      transparent gradient stops, SVG data-URI icons
- [ ] B2. `build.mjs screens`: run `astro preview` on the built site, drive the
      local Chrome over DevTools, one screenshot per tool in a filled-in state
      (light theme, 2x)
- [ ] B3. `build.mjs pdf`: assemble HTML, guard against overflow (assertFitsPage),
      print with tagged PDF + outline, own metadata, refuse transparency
      (assertOpaque), compute tool → page map by reading each page's text
      (`pdftotext`), write `manual-pages.json`
- [ ] B4. Inspect every page rendered by PDFKit (`render-preview.swift`), not
      pdftoppm; iterate on the design until it is right
- [ ] B5. UI: "User manual (PDF)" link in the home footer, a card/button in the
      home, and on each tool page a link to `…pdf#page=N`; i18n keys in all 5
      locales ("English" noted, `hreflang="en"`, `type="application/pdf"`, size)
- [ ] B6. Tests: unit test that every tool in the registry has a page in
      `manual-pages.json` (catches a stale manual); e2e that the footer/home/tool
      links exist and the PDF is served (200, `application/pdf`); a11y scan stays
      clean on touched routes
- [ ] B7. README/README-it mention, CHANGELOG, `npm test` + `check` + `build` +
      e2e green with output shown; PR to main (feature branch), CI green, merge
- [ ] B8. After deploy: download the PDF from the live site, check one tool
      deep link opens the right page

Compliance notes: the PDF is a static same-origin asset — nothing leaves the
browser, CSP unchanged. Font licences (OFL) shipped next to the fonts and listed
in the manual's colophon. No ADR needed (no architectural or compliance decision).

## Part C — Release (Andrea: "go straight to release", 2026-11-06)

- [ ] C1. Version bump (minor: new user-facing manual) + CHANGELOG
- [ ] C2. cra-evidence W2: SBOM, scan, supply-chain diff vs 1.7.2, triage
- [ ] C3. Tag, GitHub release with artifacts (incl. the PDF), container SBOM
- [ ] C4. Live-site check: home→tool navigation, PDF download, deep link

## Review
