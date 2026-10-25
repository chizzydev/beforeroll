# BeforeRoll M3-S11 v0.9.0 — Project-first integrated production desk

## What this bulk increment actually accomplishes

M3-S10 preserved validated imported sources and versioned local production workspaces but lacked a native browser path to those capabilities. M3-S11 now integrates them into the same running application, as the default *Productions* mode on the owner's loopback server. The old synthetic Research Replay remains accessible as a separate research mode, not a substitute for project state.

One end-to-end **local, zero-model** browser/API pipeline is now connected:

1. Create or reopen a named production. Project versions and original documents persist under the M3-S10 stable per-user directory.
2. Import valid UTF-8 permit/amendment files and independently import CSV, supported text, or typed JSON scene sheets. Keep hashes, source-format receipts, exact text, scene row lineage and segmentation warnings.
3. Review an ordered multi-document × multi-scene source-bound task plan, including short source restrictions. Exact source quotes, codepoint ranges, task IDs, original fingerprints and source context remain available.
4. Page potentially large task plans instead of truncating them or claiming partial coverage is full coverage.
5. Record an explicit human action on a **verified, current source-task ID**. Preserve reviewer, reason, decision and old history. Update under optimistic version checks; reject stale writes.
6. Distinguish *not AI evaluated*, *human-reviewed*, and *not clearance*. No fabricated scores. No provider requests are invoked by project operations.

`src/production-review.mjs`: one joined projection for the browser and its immutable source-derived task IDs, plus verification of human-review targets. `public/workspace-desk.mjs`: complete local project controller and source browser. `server.mjs`: adds paginated project overview and source-task review endpoints, retaining the original research replay and live pilot routes. `public/app.js`: makes local Productions the default landing experience and keeps existing research controls available. Presentation style remains intentionally provisional: functional workflow first; the user requested final coordinated UI redesign later.

## Security and honest boundaries

- Project routes work only on a loopback-bound local owner instance and reject foreign browser origins. They are not authenticated multi-user project hosting.
- Each file input is strictly verified by the M3-S10 importer. PDF/DOCX/OCR remain **unsupported** and explicitly rejected, not guessed.
- The unified project flow currently **does not execute live multi-scene model plans**, persist paid execution checkpoints, or deliver full PDF/DOCX intake. These are the next substantive engineering tasks. Only original user-triggered research-recording replays exist in the older research mode.
- The task planner's coverage means segmented text checked for Unicode representation, NOT exhaustive legal/permit authority. Source authenticity, precedence, jurisdiction and prerequisites are not verified.
- Source review history remains even when a document changes, but stale task IDs no longer map to an active review. No blanket filming authorization is issued.
- The original owner-recorded U01/U02 evidence and frozen gold labels are unchanged.

## Local acceptance result

Node 22 independent cumulative suite: **129/129 pass**; Node syntax validation PASS. Original U01/U02 frozen scores and U03 preflight remain separate read-only acceptance checks. **Windows verification pending owner run** using `scripts/Verify-M3S11.ps1`; no Windows GUI run requested.
