# BeforeRoll M3-S16 — Unified review and source-bound dossier

## Baseline
- Built cumulatively on owner-accepted M3-S15 v0.13.0: 200/200 Windows automated tests, U01/U02 5/5, U03 omitted-source sentinel.
- New engineering source version: 0.14.0. This does **not** declare the product finished or UI acceptance complete.
- No live Clocked requests in this increment; original recorded provider fixtures retained byte-for-byte.

## Substantial integrated engineering
- Added one read-only production dossier deriving state directly from the versioned owner workspace, exact source/scene intelligence plan, audited durable model ledger, documentary authority graph, scene-scope register, timed operations/prerequisites and current human decisions.
- Source fingerprints, original-file hashes (where available), exact source ranges and quotations, scene rows, current and stale human work, original provider request hashes and evidence-origin distinctions flow into the same packet. No new parallel mutable status state.
- Per-scene review summaries show individual tasks, model completion/unknown status, unresolved original conditions, stale scope claims, outstanding human task reviews, unreviewed dates and operational prerequisites. NONE of these statuses assert effective filming authorization.
- Any unsupported call-sheet line, missing transcript confirmation, incomplete source plan, missing model calls or unknown-billing records remains explicitly outstanding. A complete segmented model run is not legal document completeness.
- Historical human review records are preserved when original sources change, but excluded from current completed-review tallies. Archive counts from older provider plans are visible without transplanting old model results.
- Added **private loopback-only** GET endpoints: `/api/workspaces/:id/dossier` (complete deterministic hashed JSON evidence), `/dossier/summary` (compact browser status), `/dossier/markdown` (source-quoted human-readable packet). Uses existing same-origin and private workspace gating.
- Connected integrated status and two dossier export actions to the current project-first Productions desk. This is functional integration, NOT the deferred cohesive final visual redesign.
- Export is deterministic for the same exact source/version, execution evidence and explicit canonical UTC `asOf` time. SHA-256 protects accidental modification; not independent third-party authentication.
- No automatic API retries, invented model scores, extra Clocked endpoints, manual operating system screenshots or user-provided files used in testing.

## Automated verification
- 217/217 Node automated tests PASS, including 17 new M3-S16 tests for cumulative model decisions, missing documents, original offsets, >100 tasks, partial and unknown-billing runs, old-provider archives, stale review claims, PDF review blocks, provenance, HTTP export and read-only model-neutral cases.
- Frozen preflight U01/U02/U03 PASS; U01 5/5 and U02 5/5 original owner-recorded proof (no new provider calls).
- The complete existing M3-S15 test suite remains unchanged and passing.
- Final source file manifest and clean extraction are separately verified by `scripts/verify-m3s16-source.mjs`.

## Remaining engineering, intentionally not asserted complete
- Independent end-to-end owner GUI acceptance is postponed until functional completion.
- Final UI/UX overhaul separate after functional completion, per owner decision.
- Human inspection of complex permit PDFs, documentary authenticity, real-world coverage, scene-scope decisions and legal authority are not automated.
- No independent film-production-user acceptance, access-controlled public multi-tenant workspace, or production-readiness claim.
- The production workflow's real Clocked provider execution still requires later coordinated owner acceptance; simulation tests are NOT provider calls.

## Windows gate
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-M3S16.ps1`
Final expected: `M3S16_WINDOWS_OWNER_AUTOMATED_GATE=PASS`.
