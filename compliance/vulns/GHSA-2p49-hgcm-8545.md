# GHSA-2p49-hgcm-8545 — svgo@4.0.1

**Status:** Proposed — pending human review
**Date drafted:** 2026-08-07
**Drafter:** Claude (cra-evidence) | **Decider:** [name — REQUIRED before status changes]

## Finding

- **Component:** svgo@4.0.1 (transitive of `astro@7.0.7` — build-time SVG optimizer)
- **Source:** grype scan of compliance/sbom/v1.7.0.cdx.json, 2026-08-07
- **Severity:** High. Fixed in svgo 4.0.2.
- **Summary:** Vulnerability in the SVG optimizer used during the static build.

## Exploitability in context

- **Is the vulnerable code path reachable in this product?** Only at build time, on
  first-party SVGs committed to this repository (favicon, UI icons). No untrusted SVG
  input exists in the pipeline.
- **Exposure:** build-time only.
- **Existing mitigations:** SVG inputs are first-party and version-controlled.

## Draft decision (Proposed)

- **Action:** fix — `npm update svgo` to 4.0.2 (patch, within range) at the next
  dependency cycle; expected via dependabot within days.
- **If accept or mitigate:** re-review by 2026-08-21.

## ENISA notification assessment (CRA Art. 14)

Product is out of CRA scope (voluntary dossier); assessment recorded for completeness.

- **Evidence of active exploitation:** none known
- **Notification required:** no
