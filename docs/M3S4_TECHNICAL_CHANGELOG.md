# M3-S4 Technical increment from accepted M3-S3

- Added `src/multi-scene.mjs`: strict planning, original row identities, total 8 call cap, structural response verification.
- Added `/api/semantic-batch` (requires -Live + separate operator token). Two scenes, 1–4 segmented permit clauses each. At most 8 *sequential* Decide requests, independent idempotency keys, no automatic retries. Total hourly ceiling 12 attempt slots. No partial/silent call-cap truncation. A partial response returns an explicit NOT_EVALUATED record for unattempted scenes, known-credit subtotal, and NULL total on unknown billing.
- The server request budget/active flag is per server instance, so independent test servers no longer share quota state.
- Added Review Desk `RUN CLOCKED FOR BOTH SCENES`, source-bound atomic attach (all source quotes/hashes verified before any result is shown), per-scene model coverage badges, batch coverage/credit indicator, and original batch JSON export.
- Added two-scene replay with actual owner-recorded Scene 31 evidence only; Scene 32 deliberately carries NO fabricated model outcome.
- Source/call-sheet edits and manual scene corrections invalidate model bindings across the current packet. The Markdown dossier explicitly lists evaluated/partial/not evaluated for EACH scene.
- Fixed the stale R7-only semantic provenance wording in the evidence inspector and exported report.
- Added offline browser harness previews (not a real server CSP acceptance) and new mocked transport tests. The automated tests do **not** establish Clocked accuracy on Scene 32.

Future: test fresh owner-run batch; source-coverage/segmentation challenge with documents not used in development; genuine mixed-authority cross-document conditions; broader PDF/call-sheet formats; privacy-safe deployment; final user guide/demo/video/write-up and contest submission. No feature scope is silently retired.

- Added in-flight source-revision guard for both selected-scene and two-scene live scans: if the user edits permit or scene while the API executes, any subsequent response is discarded rather than re-linking stale evidence.
- Updated How it works and source-intake copy to describe the current limited Clocked semantic pilot rather than only the original M0 schedule logic.
