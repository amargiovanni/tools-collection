# 0006 — Accept Go findings in TypeScript 7's native compiler, time-boxed

**Status**: Proposed
**Date**: 2026-11-06
**Deciders**: [maintainer — required]; Claude listed as drafter, not decider

## Context

The v1.8.0 release scan (compliance/sbom/v1.8.0.vulns.json) reports 26
findings, all in one file: the `tsc` binary of
`@typescript/typescript-darwin-arm64`, TypeScript 7's native type-checker,
which embeds Go stdlib go1.26.4 and golang.org/x/text v0.38.0 — 2 Critical,
17 High, 7 Medium. Every npm finding of the scan was fixed before the release
(#162).

The binary is a development tool. It type-checks the project's own sources on
developer machines and in CI. It is not part of the static site, not in the
Docker image (nginx serving `dist/`), never runs in production and receives no
attacker-controlled input. TypeScript 7.0.2 is the latest stable release; no
version built with a fixed Go toolchain exists, so the repository cannot fix
these findings itself.

ADR 0002 accepted three of these Go findings with a re-review by 2026-09-07.
That date passed without a recorded re-review: the time box lapsed silently.

## Decision

Accept the 26 findings until a stable TypeScript release built with Go
≥ 1.26.9 / x/text ≥ 0.41.0 is available, with a hard re-review at the next
release or **2026-12-07**, whichever comes first. This also renews the lapsed
time box of ADR 0002 for GO-2026-4970, GO-2026-5856 and GO-2026-5970.

Follow-up proposed, not yet built: a check that reads every accepted record's
re-review date and fails the release while one is past due, so a time box
cannot lapse silently again.

## Alternatives considered

- **Pin TypeScript 6 (JavaScript compiler, no Go)** — removes the findings but
  undoes the TypeScript 7 upgrade and its type-checking for no runtime benefit.
  Rejected.
- **Use the `7.1.0-beta` / nightly builds** — may be built with a newer Go, but
  puts a pre-release compiler in the toolchain. Rejected; revisit at 7.1 stable.
- **Drop type-checking from CI** — the check was added in #155 because errors
  had gone unnoticed. Rejected.

## Consequences

- The release ships with 26 known, build-time-only findings, all recorded in
  `compliance/vulns/GO-*.md` (status Proposed until this ADR is decided).
- Dependabot bumps of `typescript` resolve them; the next scan confirms it.
- Re-review is due 2026-12-07 at the latest.
