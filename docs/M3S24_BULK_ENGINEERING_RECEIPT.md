# M3-S24 — Atomic, guided end-to-end production integration (v0.22.0)

## Accepted basis and purpose

This increment is based on the M3-S23 v0.21.0 source distribution. The **last separately reported Windows acceptance was M3-S22 (347/347)**; S23's 368 automated tests were independently passed during its preparation but an S23 owner-run Windows result was not supplied before work on S24 began. The S24 verification is cumulative and includes those tests. This receipt documents functional engineering, not final user-experience or live-provider acceptance.

Previously, BeforeRoll's long production page mounted dozens of unrelated controls at once, and the client assembled its project view through many independent HTTP requests. Those requests could observe different project revisions or different Clocked journal snapshots. The production page also depended on an experimental replay fixture loading successfully before its primary app was accessible. The action queue described things to do but frequently could not navigate to the exact source task when it was beyond page 1. Evidence exports were not tied to the production version and time slice being reviewed.

## What is now one actual product workflow

The production begins in the primary local workspace (not in the research replay). From the same selected project, the operator follows seven explicit stages:

1. **Originals / source verification** — existing PDF, DOCX, CSV, text and JSON intake controls; retained original SHA-256; text/scene verification and conservative unsupported-format handling.
2. **Documentary and scene scope** — human-recorded claimed issuing party, amendments, exact source unit and scene applicability. No automatic verification of permission.
3. **Source-to-scene analysis** — unbilled plan and explicit, bounded durable Clocked batches. Real live requests still require the separate server-side key and owner operator token; interrupted/unknown-billing requests are not silently retried.
4. **Findings and human review** — scene workbench and current production action queue now occupy the *same* review stage. The existing review-session preview and atomic commit remain in place.
5. **Production prerequisites** — scene schedules, IANA timezone, original-linked obligations, overdue items, human condition decisions and historical source states.
6. **Document revisions** — original source controls remain the same, but revision preview/commit is a separate explicit workflow stage. Replacement commits still require the exact source and previously derived server fingerprint.
7. **Audited evidence** — original file register, integrated source/scene/Clocked/human/operations review dossier, and export of Markdown/JSON evidence; never legal or filming clearance.

The sidebar remains solely a way to create/open a production. Legacy research playback remains separately accessible for evidence study, but it is no longer a required initialization dependency or a step in production analysis. Functional controls are reused, not cloned into additional independent editors. Visual aesthetics remain scheduled for a later coordinated redesign.

## Atomic same-version evidence snapshot (the central integration change)

`GET /api/workspaces/:id/workflow` reads one persisted workspace **once**, computes one current dossier for a single `asOf`, and assembles the source originals inventory, source-unit/scene plan, Clocked execution journal summary, authority register, scene authority register, operations, scene workbench, next-actions queue, and derived journey checkpoints. Their persisted versions and dossier SHA-256 references must agree. The browser now uses one authoritative read after project edits (plus the separate project index listing), rather than approximately 10 independently timed data reads. No second database or mutable workflow stage ledger was introduced.

`src/production-journey.mjs` verifies the dossier fingerprint and original-register project/version before deriving stage statuses. Status words such as BLOCKED, ATTENTION, CURRENT or STOPPED refer to *recorded operator work*, never legal approval. Stages remain user-selectable even when upstream work is incomplete. The current source and complete dossier remain authoritative; checkmarks are not proof that the full permit set was provided or fully understood.

The production action queue now includes stable global and per-scene source-task offsets computed from the same audited dossier. A task past the first 40 rows can be opened in its exact project and scene context. Operations actions can select the exact original-linked prerequisite; documentary/source actions can focus the relevant document. Stale/unknown task pointers fail instead of opening a different clause.

## Snapshot-bound evidence export

JSON and Markdown dossier download requests now carry the exact source-bound dossier SHA-256, `asOf`, and persisted version from the current workspace view. If another operation changed that evidence after review, export returns HTTP 409 requiring a new inspection. A completion claim is never manufactured by simply hiding unresolved items.

## Automated integration evidence

New `tests/m3s24-atomic-production-journey.test.mjs` executes a real local server and covers: empty project blockers; synchronized dossier/project/original/scene identifiers; original file import and custody; source metadata; scene-specific restrictions and unissued amendment requests; human scene dates; source-bound conditions and their decisions; simulated **not billable** Clocked HTTP transport; all exact-task human reviews; source-impact preview and exact commit; present-vs-historical model separation after source replacement; current JSON/Markdown dossier export; refusal to export an older version; read-only same-origin protections; invalid scene navigation after a call-sheet replacement; HTML injection safety; and browser-controller navigation across plan pagination. A separate pure-function test rejects tampered dossiers.

All new model results generated in these tests are expressly **fake transport results**, not Clocked sponsor observations. The original owner-recorded U01/U02 JSON scorecards remain unchanged and are checked read-only via the Windows gate; U03 remains a source-only omission sentinel.

## Deliberate remaining limits

- The underlying PDF/DOCX extractor is conservative; scanned pages, difficult layouts and unparsed attachments still need explicit owner review. No OCR or legal-authentication claim is made.
- The intelligence planner retains its previously documented 3,000-task ceiling; no claim of unlimited project size.
- Human source relationships, fulfilled prerequisites, document authenticity, amendment precedence and signatures are not independently authenticated.
- Unknown billing or failed real-provider response still requires manual investigation and cannot be silently retried.
- The local owner workspace is not an authenticated multi-user cloud service; it must remain loopback private.
- This increment does **not** constitute real-user acceptance, a full product-completeness certification, a redesigned UI, or an evaluation of the new workflow against the actual live provider.

## Owner gate

After downloading/extracting the versioned ZIP, run `scripts/Verify-M3S24.ps1` from any working directory. It validates the complete immutable distribution against SHA-256, checks critical source syntax, runs the whole offline suite, checks frozen source preflight, and scores both original owner-recorded Clocked captures. No API key, Windows GUI session, personal photos or external documents are required.
