# GHSA-f88m-g3jw-g9cj — sharp@0.34.5

**Status:** Proposed — pending human review
**Date drafted:** 2026-08-07
**Drafter:** Claude (cra-evidence) | **Decider:** [name — REQUIRED before status changes]

## Finding

- **Component:** sharp@0.34.5 (transitive of `astro@7.0.7` — build-time image service)
- **Source:** grype scan of compliance/sbom/v1.7.0.cdx.json, 2026-08-07
- **Severity:** High. Fixed in sharp 0.35.0.
- **Summary:** Vulnerability in the image-processing library Astro uses to optimize
  images during the static build.

## Exploitability in context

- **Is the vulnerable code path reachable in this product?** Only at build time, and
  only on images committed to this repository (currently a single SVG favicon; no
  user-supplied images exist anywhere in the pipeline).
- **Exposure:** build-time only.
- **Existing mitigations:** image inputs are first-party and version-controlled.

## Draft decision (Proposed)

- **Action:** fix — arrives when astro raises its sharp range (0.35.x); tracked via
  dependabot. No action possible in-range today without an override.
- **If accept or mitigate:** re-review by 2026-09-07.

## ENISA notification assessment (CRA Art. 14)

Product is out of CRA scope (voluntary dossier); assessment recorded for completeness.

- **Evidence of active exploitation:** none known
- **Notification required:** no
