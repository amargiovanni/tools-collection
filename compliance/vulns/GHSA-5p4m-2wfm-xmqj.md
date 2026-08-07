# GHSA-5p4m-2wfm-xmqj — js-yaml@4.3.0

**Status:** Accepted — 2026-08-07
**Date drafted:** 2026-08-07
**Drafter:** Claude (cra-evidence) | **Decider:** Andrea Margiovanni (2026-08-07)

## Finding

- **Component:** js-yaml@4.3.0 (transitive of `astro@7.0.7` — build-time dependency)
- **Source:** grype scan of compliance/sbom/v1.7.0.cdx.json, 2026-08-07
- **Severity:** High. Fixed in js-yaml 4.3.1.
- **Summary:** Vulnerability in the YAML parser used by Astro's build toolchain
  (content/config parsing at build time).

## Exploitability in context

- **Is the vulnerable code path reachable in this product?** Only at build time, and
  only on YAML authored in this repository (tool metadata, config). No untrusted YAML
  is ever parsed; the shipped site contains no js-yaml code (verified: static output,
  YAML parsing not bundled client-side).
- **Exposure:** build-time only.
- **Existing mitigations:** inputs are first-party files under version control.

## Decision (Accepted)

- **Action:** fix — `npm update js-yaml` to 4.3.1 (within astro's semver range) at the
  next dependency cycle; expected to arrive via dependabot within days.
- **If accept or mitigate:** re-review by 2026-08-21.

## ENISA notification assessment (CRA Art. 14)

Product is out of CRA scope (voluntary dossier); assessment recorded for completeness.

- **Evidence of active exploitation:** none known
- **Notification required:** no
