# BeforeRoll M3-S20 — lifecycle continuity, backup and conservative recovery

## Accepted input and architecture

Input: owner-accepted M3-S19 v0.17.0, with 281/281 Windows automated tests. M3-S20 adds a **single production lifecycle proof** derived from the existing persisted workspace and **all** existing exact Clocked execution journals. No new mutable product database, model calls or provider-generated content is introduced.

The lifecycle proof reconciles the current source revision, planned document-to-scene tasks, persisted human reviews, dated prerequisites, documentary scope claims, source revision history, Clocked attempts, interrupted/unknown-billing states, archived prior-plan runs, derived action queue and integrated dossier identity. Its `asOf` UTC instant is pinned so evidence and open work can be recomputed consistently.

## Engineering additions

1. `src/durable-execution.mjs` now supports one-read atomic snapshot of the current journal for status **and** model evidence, eliminating a torn-view hazard from two sequential separate file reads. `currentDossier` now uses it. All original request fingerprints and the on-disk journal schema remain unchanged.
2. An owner-local backup can export the entire current normalized production project (sources, imported byte fingerprints, source quotations, provenance metadata, source/scope/operational history and human review records) plus current **and archived** original Clocked execution journals. No keys and no extra model results are generated.
3. Every journal is checked for structural integrity, original SHA-256 and attempt accounting. The current journal is **additionally** revalidated against the current source-specific plan. Archived journals cannot be source-revalidated if their earlier documents are no longer present; the backup **explicitly labels** this limitation.
4. A deterministic lifecycle-integrity report is derived from the same project, exact run data, integrated dossier and action queue; its checksum is independently recomputed during verification.
5. A local owner-only command-line recovery restores validated execution journals **before** reintroducing project state. It refuses existing production IDs and existing journal files, requires an exact project ID confirmation, and makes **zero Clocked requests**. Attempts and unknown-billing states remain preserved; they are never silently reset.
6. `GET /api/workspaces/{id}/lifecycle` provides owner-local read-only continuity statistics. `GET /api/workspaces/{id}/lifecycle/backup` supplies the complete local JSON backup. A button in the current Production Desk exposes the private export; this is not the planned visual overhaul.
7. `scripts/lifecycle-cli.mjs` offers owner `backup`, `verify`, and explicitly confirmed `restore` commands.

## Scope, safety and limitations

- **NOT** a production clearance engine. Human decisions are not signature authentication, and Clocked scores are not calibrated probabilities.
- The SHA-256 checksums identify a consistent exact local snapshot and accidental/tampered edits; they are **not digital signatures** and do not establish origin or provider attestation.
- **Original binary PDF/DOCX files are NOT embedded in the backup**, only normalized extracted text, source map and original byte SHA. Owners must preserve the originals separately.
- Archived model journals cannot be reinterpreted as current after any source change. They retain their original attempt/billing history.
- A copied backup contains sensitive proprietary production text and must remain private.
- Recovery into an existing project is intentionally unsupported. The new store starts with persisted version 1 while the original version is retained in the portable backup receipt.
- A process crash mid-recovery can strand journal files in the destination. Recovery never automatically discards them: inspect/recover deliberately; do not delete unknown-billing evidence.
- Only local-owner production routes are enabled as in the accepted baseline. No final GUI acceptance, live provider run or competition submission work is claimed.

## Automated acceptance

- 25 new focused tests cover original and archived provider journal preservation, checksum corruption, human review/scheduling integration, incomplete projects, source change, file conflicts, zero-retry after unknown billing and in-flight restoration, no-overwrite, read-only local HTTP, and cross-surface evidence consistency.
- Existing 281 tests remain unchanged; **306 automated tests PASS** in the development environment.
- Original frozen owner-recorded U01 and U02 remain separately scored by the Windows verification script; U03 remains preflight only.
- Owner Windows engineering acceptance is pending.

## Next engineering direction

Validate larger complex-project lifecycles and finish end-to-end functional readiness before the coordinated GUI acceptance and then the separate UI/UX overhaul. The project is not declared complete by this increment.
