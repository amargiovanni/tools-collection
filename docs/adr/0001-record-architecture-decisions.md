# 0001 — Record architecture decisions

**Status:** Proposed
**Date:** 2026-08-07

## Context

tools-collection has grown a compliance evidence trail (`compliance/`) whose
triage decisions and architectural choices need durable, reviewable records.
No decision log existed.

## Decision

We will record architecturally significant decisions as ADRs in `docs/adr/`,
numbered sequentially. Claude drafts proactively with status `Proposed`;
the maintainer reviews and flips to `Accepted`. Accepted records are
immutable — changes require a superseding ADR.

## Alternatives considered

- **No decision log** — the status quo; rejected because compliance triage
  decisions (risk accepts) require a citable record.
- **Decisions in CHANGELOG entries** — rejected: mixes user-facing release
  notes with internal rationale, and entries are not individually citable.

## Consequences

- Compliance records under `compliance/vulns/` can reference ADRs by number.
- One more artifact to keep honest; the cra-evidence dossier links here.
