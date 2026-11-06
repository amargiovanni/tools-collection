# User manual (PDF)

`public/manual/tools-collection-manual.pdf` — the "Field Manual": cover,
introduction, contents, one entry per tool with a real screenshot, grouped by
category with thumb-index tabs. English only. Linked from the home page (hero
and footer) and from every tool page, which opens the PDF on that tool's page
(`#page=N`, from `src/config/manual-pages.json`).

## Rebuild

Run after adding, renaming or changing a tool (a unit test fails while the
manual is missing a tool), and before every release so the cover carries the
version:

```sh
npx astro build                      # the screenshots come from the built site
node docs/manual/build.mjs screens   # or: screens <tool-id> for one tool
node docs/manual/build.mjs pdf       # PDF + src/config/manual-pages.json
swift docs/manual/tools/render-preview.swift \
  public/manual/tools-collection-manual.pdf /tmp/manual-page 1400
```

No extra packages: Playwright's Chromium (already used by the e2e suite) takes
the screenshots and prints the PDF; `pdftotext` (poppler) checks the page map.

## Sources

| File | What |
|---|---|
| `content.json` | Per tool: the "How to use" sentence and the screenshot recipe (`fill` values for the fields in DOM order, buttons to `click`) |
| `catalogue.mjs` | Reads the registry (`src/config/tools.ts`), names and descriptions (`en.json`) and icons — the manual cannot drift from the site |
| `pdf.mjs` | Lays out fixed A4 sheets, prints, writes the page map |
| `print.css` | The design |
| `review/` | Fact-check of the tool sentences against the code |

## What the build refuses

- a sheet whose content overflows the page, or a missing image;
- any transparency in the PDF (`/SMask`, `/S /Transparency`, `/ca` or `/CA`
  below 1) — macOS Preview draws it as grey boxes. `print.css` uses opaque
  colours only: tints are pre-mixed hex, no `box-shadow`, `rgba`, `opacity`,
  `color-mix`, `mask` or SVG data URIs;
- a page map that does not match the printed PDF (each tool's number is looked
  up on the page the map gives).

The pages must also be looked at as **PDFKit** renders them
(`tools/render-preview.swift`, the engine of macOS Preview), not with
`pdftoppm`, which hides what Preview gets wrong.
