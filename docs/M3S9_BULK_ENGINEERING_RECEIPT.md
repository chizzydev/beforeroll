# BeforeRoll M3-S9 — First coordinated bulk engineering foundation

This increment implements source intake/coverage, cross-scene workspace identity, and a single verified intelligence-planning/checkpoint pipeline. It is intentionally **not** a user-interface release, live migration, or completion claim.

## Delivered

- `src/permit-intelligence.mjs`: exhaustive non-whitespace Unicode-source coverage proposal; exact ranges and quotes; short prohibitions; bullet/paragraph boundaries; contextual neighboring units; bounded fail-closed handling for overlong/unsupported spans. Coverage of text does **not** imply discovery of all legal/semantic implications.
- `src/production-workspace.mjs`: multi-document source identity, revision tracking, call-sheet scene reconciliation, selective invalidation of stale evidence, human review history, source-invariant serialization.
- `src/intelligence-workflow.mjs`: unified source->scene->candidate planning with exact original hashes and structured context, explicit costs, multi-document/multi-scene worklist, checkpointed no-retry transactions, failed/incomplete outcome quarantine.
- `server.mjs`: offline `POST /api/production/plan` to exercise the cohesive planning pipeline; never spends model credits. Existing M3S8 replay and pilot APIs remain unchanged.
- `tests/m3s9-bulk-workflow.test.mjs`: scenario tests for Unicode/short restrictions/unsafe omissions, documents, invalidation, planned costs, provider faults, request duplicates, and API preview.

## Verification

- Locally executed Node v22.16.0 full suite: **104/104 passed, 0 failed**.
- Existing M3-S6 U01/U02 frozen original evidence, their prerecorded results and judges' scoring contracts untouched.
- No live Clocked calls made. No owner Windows GUI acceptance requested or claimed.

## Non-claims and remaining engineering

- Source coverage means every nonwhitespace codepoint is represented as a review candidate, not that its legal meaning was extracted exhaustively. Overlength blocks stop instead of truncating.
- This implementation lays the integrated domain foundation but DOES NOT yet replace the legacy Review Desk browser UX, the legacy M3-S8 two-scene live path, or the supported input formats.
- Next **bulk** should wire actual multi-document import/validation, persistence, production-scale analysis and unified UI state through the new engine before any coordinated owner GUI run.
- Public release, README, demo, video and submission are intentionally out of scope until functional completion.
