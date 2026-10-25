# M3-S17: Actionable Production Control v0.15.0

**Accepted input:** M3-S16 owner Windows acceptance: 217/217 PASS; original U01 5/5 and U02 5/5.

## Engineering (substantial integrated functional increment)

1. One **prioritized human work queue** derives directly from the exact same source-bound integrated production dossier, model journal, dated operational prerequisites, and human decisions. No duplicate work database or invented permission statuses. It contains document intake/transcription needs, missing provenance, unsupported source rows, each unevaluated model comparison, uncertain provider outcomes, each human original-source review, suspected unverified grant scope, scene scheduling, missing scene authority and open/overdue prerequisites. Urgency sorting is deterministic; filters, pagination, per-scene links, original quotations, hashes and stable action identifiers are retained.
2. A **read-only source change impact preview** executes the SAME source import function as the real writer against a cloned workspace, showing exact source-scene task identities retained, retired and added, model planning blocks, preservation of historical decisions, and stale conditions. It does not modify persisted workspaces, touch provider billing, or issue a model request. Server enforces optimistic version checks and loopback same-origin protections. Same normalized text under different original file bytes is still fail-closed.
3. The project-first browser Productions desk now includes prioritized work actions and pagination, source file impact preview, and a distinct **commit the exact previously previewed file** action. Selected files are held only in browser memory across rerender; the original source remains unchanged until explicit commit. Changed persisted project version invalidates commit. The integrated dossier is still the only source of current state.
4. Dedicated GET `/api/workspaces/:id/actions?kind=...&offset=...&limit=...&sceneId=...` and POST `/api/workspaces/:id/impact` endpoints. Source-backed lists never claim film office approval, signature verification, calibrated probabilities or comprehensive permit authority.
5. New engineering validation includes HTTP end-to-end preview -> versioned commit -> stale review archival -> exact new action queue, source history, unknown billing, >100 tasks, escaping, pagination, malicious filters and privacy protection.

## Outcome & limitations

- Local automated tests: **240/240 PASS**; 23 new M3-S17 tests.
- Original frozen U01/U02 Clocked owner recordings remain unchanged and pass 5/5 each. U03 omission source preflight remains PASS.
- No live provider calls. New work queue relies on real model results only if original audited records are present. No simulated model result displayed as a live recording.
- This is NOT full product completion or UI acceptance. Full owner end-to-end validation and design overhaul are deferred by user instruction; additional integrated functional work may still be needed.
- No public deployment or production account controls included. Locally stored workspaces remain loopback-only.

## Windows automated gate

From extracted folder, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-M3S17.ps1`.

Expected final marker: `M3S17_WINDOWS_OWNER_AUTOMATED_GATE=PASS`.
