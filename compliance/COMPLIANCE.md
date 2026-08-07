# Compliance Evidence Dossier — Tools Collection

**Repository:** amargiovanni/tools-collection
**Status:** Draft — pending human review
**Last updated:** 2026-08-07 by Claude (drafter) / Andrea Margiovanni (reviewer, pending)

> This dossier is assembled by the `cra-evidence` skill. Claude drafts;
> humans review and approve. Nothing in this file is a conformity claim
> until a named human reviewer has approved it.

## 1. Product identification

- **Product:** Tools Collection — a free, open-source collection of 53 browser-based
  developer utilities (formatters, generators, converters, inspectors) in 5 languages.
  All processing happens client-side in the visitor's browser; no user data is ever
  transmitted to or stored on a server.
- **Distribution:** static site (Cloudflare Pages, tools.margiovanni.it) and a Docker
  image (nginx serving the same static build) published to GHCR.
- **CRA scope:** out of scope — free and open-source software made available outside
  the course of a commercial activity (Recital 18, Reg. (EU) 2024/2847). This dossier
  is maintained **voluntarily** as engineering best practice; Annex I items are tracked
  as advisory, not as legal obligations.
- **EAA scope:** voluntary — the product is not in an EAA-mandated service category,
  but targets WCAG 2.2 AA as a matter of policy. A11y audit routes: all English routes.
- **Scope rationale / decided by:** Andrea Margiovanni, 2026-08-07 (recorded in
  session; legal determinations, not Claude's).

## 2. Release evidence log

One row per tagged release. Artifacts live under `compliance/`.

| Release | Date | SBOM | Supply-chain diff | Vulnerabilities (open / triaged) | Reviewer |
|---------|------|------|-------------------|----------------------------------|----------|
| v1.6.0 | 2026-06-08 (SBOM retroactive, 2026-08-07) | [sbom/v1.6.0.cdx.json](sbom/v1.6.0.cdx.json) (437 components) | baseline | 20 (1 Critical, 9 High, 7 Medium, 3 Low) — superseded by v1.7.0 | pending |
| v1.7.0 | 2026-08-07 | [sbom/v1.7.0.cdx.json](sbom/v1.7.0.cdx.json) (408 components) | [sbom/diff-v1.6.0-to-v1.7.0.md](sbom/diff-v1.6.0-to-v1.7.0.md) — 57 added, 104 removed, 126 version changes (headline: astro 6.3.6→7.0.7, vite 7→8, typescript 6→7 native, @astrojs/solid-js 6→7, tailwind 4.3.3) | 7 / 7 (0 Critical, 5 High, 2 Medium — all triaged, none reachable in shipped product) | pending |

**Plain-language summary:** the v1.7.0 dependency wave (17 dependabot PRs)
removed 13 of the 20 known vulnerabilities present in v1.6.0's supply chain,
including the only Critical (seroval). The 7 remaining findings all live in
build-time tooling that never ships to users; each has a draft triage record.

## 3. Current vulnerability triage register

Detailed records: one file per finding under `compliance/vulns/`.

| ID | Component | Severity | Draft decision | Status | ADR |
|----|-----------|----------|----------------|--------|-----|
| GO-2026-4970 | Go stdlib (tsgo, via typescript@7.0.2, dev) | High | accept, time-boxed to 2026-09-07 | Proposed | pending |
| GO-2026-5856 | Go stdlib (tsgo, via typescript@7.0.2, dev) | Medium | accept, time-boxed to 2026-09-07 | Proposed | pending |
| GO-2026-5970 | golang.org/x/text (tsgo, via typescript@7.0.2, dev) | High | accept, time-boxed to 2026-09-07 | Proposed | pending |
| GHSA-5p4m-2wfm-xmqj | js-yaml@4.3.0 (build) | High | fix — npm update to 4.3.1, next cycle | Proposed | — |
| GHSA-f88m-g3jw-g9cj | sharp@0.34.5 (build) | High | fix — when astro raises range to 0.35.x | Proposed | — |
| GHSA-2p49-hgcm-8545 | svgo@4.0.1 (build) | High | fix — npm update to 4.0.2, next cycle | Proposed | — |
| GHSA-4g3v-8h47-v7g6 | astro@7.0.7 (build/dev server) | Medium | fix — upgrade to 7.1.0, next cycle | Proposed | — |

## 4. CRA Annex I gap report

Latest run: 2026-08-07 (release v1.7.0). **The product is out of CRA scope**
(free OSS outside commercial activity — see section 1); this report is
maintained voluntarily and its items are advisory. The underlying checklist is
a DRAFT pending review by counsel.

| Item | State | Evidence / remediation |
|------|-------|------------------------|
| I.1 risk assessment `[org]` | **gap** | Requires organizational evidence: no documented risk assessment. Remediation: one-page threat model of the client-side-only architecture. |
| I.2a no known exploitable vulns | **conformant** | v1.7.0 scan: 0 Critical; 7 findings, all build-time only, none reachable in the shipped static site (compliance/vulns/, sbom/v1.7.0.vulns.json). |
| I.2b secure-by-default | **conformant** | Shipped artifact is static files; no credentials, no debug surface; Docker image is stock nginx serving the build (Dockerfile). |
| I.2c security updates | **conformant** | Continuous deploy from main (Cloudflare Pages); Docker `latest`/`main` + versioned tags from v1.7.0 (dockerbuild.yml, fixed this release); dependabot enabled (.github/dependabot.yml). |
| I.2d unauthorized-access protection | **not applicable** | No accounts, no server-side data, no non-public functionality — all processing is in-browser. |
| I.2e confidentiality / encryption | **conformant** | TLS enforced by Cloudflare Pages; no user data stored or transmitted by design; no secrets in repo (no .env, none committed). |
| I.2f integrity of code/config | **gap** | Release artifacts and Docker images are not signed/attested. Remediation: GitHub artifact attestations or cosign in dockerbuild.yml. |
| I.2g data minimisation | **conformant** | Architecture processes no personal data; tool inputs never leave the browser; site analytics (Cloudflare Web Analytics) is cookieless and aggregate. |
| I.2h availability after incident | **not applicable** | Stateless static content on a CDN; recovery is redeploy-from-git. |
| I.2i impact on other services | **conformant** | Shipped product makes no outbound calls at runtime (client-side only). |
| I.2j limit attack surface | **conformant** | Exposure is static assets only; no admin surface, no API; dependency count reduced this release (437→408). |
| I.2k exploitation mitigation | **gap** | No Content-Security-Policy or hardening headers on either distribution. Remediation: add `public/_headers` (Pages) and nginx headers (Docker) — CSP, X-Content-Type-Options, frame-ancestors. |
| I.2l security logging | **not applicable** | No server-side activity of the product to record; edge logs are the host platform's. |
| I.2m data removal | **conformant** | Only user state is browser localStorage (favorites/recents), user-clearable; nothing stored server-side. |
| II.1 SBOM | **conformant** | CycloneDX SBOMs per release: sbom/v1.6.0.cdx.json, sbom/v1.7.0.cdx.json + diff. |
| II.2 timely remediation `[org]` | **conformant** | This release removed 13/20 known findings including the only Critical within the dependabot cycle; register carries dates and decisions. |
| II.3 regular testing `[org]` | **conformant** | CI (tests+build) on every push/PR; per-release W2 scan mandated by CLAUDE.md policy block. |
| II.4 disclosure of fixed vulns `[org]` | **gap** | No advisory channel in use. Remediation: GitHub Security Advisories or a security section in release notes when fixes ship. |
| II.5 CVD policy `[org]` | **gap** | No SECURITY.md. Remediation: publish a coordinated vulnerability disclosure policy (cra-incident-reporting skill drafts it). |
| II.6 reporting contact | **gap** | No security reporting contact published. Remediation: SECURITY.md with contact + optional security.txt. |
| II.7 secure update distribution | **gap** | `main` is not branch-protected (verified 2026-08-07); tags/images unsigned. Remediation: enable branch protection requiring CI; consider signed tags and image attestations. |
| II.8 free timely patches `[org]` | **conformant** | Free product; patches reach the site immediately via continuous deploy and Docker users via `latest` + versioned tags. |

## 5. Accessibility (EAA) — frontend products only

Automated axe-core results per route, plus the manual-check list. Automated
scanning covers only part of WCAG 2.2 AA; items listed under "manual
verification required" are NOT covered until a human completes them.

**Latest automated run:** 2026-08-07, axe-core 4.12.1 (chrome-headless) against
the v1.7.0 build served locally — all 54 English routes (home + 53 tools).
Raw results: one JSON per route under `compliance/a11y/`. EAA posture is
**voluntary** (see section 1); target is WCAG 2.2 AA.

**Plain-language summary:** every route currently carries violations, but they
collapse into five recurring patterns — this is a design-system issue, not 54
separate problems. Fixing the shared tokens/components resolves most of the
315 instances at once.

| Rule (axe) | Impact | WCAG | Instances | Routes | What it means / where |
|------------|--------|------|-----------|--------|------------------------|
| color-contrast | serious | 1.4.3 (AA) | 244 | all 54 | Text below the 4.5:1 contrast ratio — systemic, comes from shared palette tokens (e.g. muted/secondary text on tinted surfaces). |
| region | moderate | best practice | 55 | all 54 | Content outside semantic landmarks (`main`, `nav`, …) — layout-level fix. |
| button-name | **critical** | 4.1.2 (A) | 9 | 3 | Icon-only buttons with no accessible name (e.g. favorites list controls) — screen readers announce nothing. `aria-label` fix. |
| label | **critical** | 4.1.2/1.3.1 (A) | 5 | 4 | Form inputs with no programmatic label (e.g. compact numeric fields) — `label`/`aria-label` fix. |
| nested-interactive | serious | 4.1.2 (A) | 2 | 2 | Interactive control nested inside another interactive control — restructure markup. |

Worst routes by instance count: `/en/tools/date-interval/` (13),
`/en/tools/uuid-generator/` (8), `/en/` (8), `/en/tools/color-picker/` (7),
`/en/tools/markdown-to-html/` (7), `/en/tools/qr-code/` (7), `/en/tools/reg2gpo/` (7).

**Suggested remediation order:** (1) the two critical rules — small, localized
`aria-label`/`label` additions on ~14 elements; (2) contrast tokens in the
shared palette (single change, ~244 instances); (3) landmark structure in the
base layout; (4) the two nested-interactive cases.

### Manual verification required (not covered by automated scanning)

Automated coverage is partial. The following remain **not yet verified** until
a named human completes them:

| Criterion | What a human must check | Status |
|-----------|--------------------------|--------|
| 1.2.x Time-based media | captions, audio description on video/audio | not yet verified (likely n/a — no media) |
| 1.3.2 Meaningful sequence | reading order with CSS off / screen reader | not yet verified |
| 1.4.5 Images of text | text rendered as images without need | not yet verified |
| 1.4.10 Reflow | usable at 320px width / 400% zoom | not yet verified |
| 1.4.11 Non-text contrast | UI component and graphic contrast | not yet verified |
| 2.1.1 / 2.1.2 Keyboard | full operation by keyboard, no traps | not yet verified |
| 2.4.3 Focus order | logical tab order | not yet verified |
| 2.4.6 Headings and labels | descriptive, not just present | not yet verified |
| 2.4.7 Focus visible | visible focus indicator throughout | not yet verified |
| 2.5.x Input modalities | pointer gestures, target size behaviour | not yet verified |
| 3.2.1 / 3.2.2 On focus / on input | no unexpected context changes | not yet verified |
| 3.3.1–3.3.4 Input assistance | error identification, suggestions, prevention | not yet verified |

## 6. Review log

| Date | Section | Reviewer | Outcome |
|------|---------|----------|---------|
| — | — | — | — |
