# GHSA-4g3v-8h47-v7g6 — astro@7.0.7

**Status:** Accepted — 2026-08-07
**Date drafted:** 2026-08-07
**Drafter:** Claude (cra-evidence) | **Decider:** Andrea Margiovanni (2026-08-07)

## Finding

- **Component:** astro@7.0.7 (direct — build framework)
- **Source:** grype scan of compliance/sbom/v1.7.0.cdx.json, 2026-08-07
- **Severity:** Medium. Fixed in astro 7.1.0.
- **Summary:** Vulnerability in the Astro framework. This project uses Astro in fully
  static output mode: Astro code runs at build time and in the local dev server, not
  in production.

## Exploitability in context

- **Is the vulnerable code path reachable in this product?** Production: no — the
  deployed artifact is static files on Cloudflare Pages / nginx with no Astro server
  runtime. Development: the dev server runs only on developer machines.
- **Exposure:** build-time / local development only.
- **Existing mitigations:** static output mode; no SSR endpoints exist.

## Decision (Accepted)

- **Action:** fix — upgrade to astro 7.1.0 at the next dependency cycle (dependabot
  will propose it; the 6→7 major was completed in this release).
- **If accept or mitigate:** re-review by 2026-08-21.

## ENISA notification assessment (CRA Art. 14)

Product is out of CRA scope (voluntary dossier); assessment recorded for completeness.

- **Evidence of active exploitation:** none known
- **Notification required:** no
