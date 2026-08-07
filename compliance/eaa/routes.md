# Routes under test

Chosen set: **all 54 English routes** (home + 53 tool pages), decided by the
maintainer on 2026-08-07 — the site is small enough that full coverage costs
little, and every tool page is a primary task flow (each tool is form-heavy
by nature). Other languages share the same templates, components and tokens;
language-specific regressions are limited to string length/wrapping and are
covered by the manual reflow check.

Route list source: `dist/en/**/index.html` after a production build.
Automated results: `compliance/a11y/axe-*.json`, one file per route.
