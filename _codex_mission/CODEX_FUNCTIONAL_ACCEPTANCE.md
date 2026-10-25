# Functional engineering acceptance — 25 October 2026

**CODEX_FUNCTIONAL_VERDICT=PARTIAL**

Substantial source-lineage, execution, browser workflow, export and recovery integration is implemented and verified. The complete requested championship is not claimed: GUI history pagination, legacy write-contract consolidation, recovery diagnostics and broader real-document/crash coverage remain in the gap register. Owner GUI acceptance is a separate, single bounded gate.

## Baseline and source control

- Instructions read completely before edits: `AGENTS.md`, `00_READ_FIRST.md`, `FUNCTIONAL_INTEGRATION_MISSION_v2.md`.
- Independent local baseline: **`c850430`**. No pre-existing `.git`; the baseline excludes `.env` and `.beforeroll-data/`.
- Initial independent `npm test`: **484 tests; 483 passed; 1 failed; 0 skipped**. The failure was the nondeterministic encrypted-tamper test documented as G14.
- Initial science preflight: U01/U02 source identities and U03 missing-source sentinel passed; zero new provider requests.
- Implementation: **`28bb878`**, followed by syntax correction **`48ef9a2`**. The clean-export run caught the final wording template error; it was corrected before final acceptance.
- No dependencies added. No remote push, deployment, private document import, visual redesign or frozen evidence edit.
- Exact-value credential scan of the 265 committed application/baseline files found **0 matches** for the configured key/owner/operator secrets. `.env` and the live receipt are confirmed ignored. Frozen fixtures/research and the original-vault implementation have no diff from the local baseline.

## Final exact verification

| Verification | Result | What it proves / limits |
|---|---|---|
| Full suite in working project after lineage changes | **493/493 passed**, zero failures/skips | Existing coverage plus nine new integration/adversarial tests. Tests alone are not product acceptance. |
| Full suite in isolated Git export of final code | **493/493 passed**, zero failures/skips | Export has no `.env`, `.git`, private production store or live receipt; runs the actual source from the committed code. Log is local/ignored under `.beforeroll-data/isolated-final/verification.log`. |
| New functional-cohesion tests | **9 cases** in `tests/functional-cohesion.test.mjs` | Exact-task retention and selective dispatch; unknown billing across revisions; source reversal freshness; restored-row integrity; documentary/operational reversal; authenticated encrypted HTTP recovery with original bytes and archived journals; large human-transcribed source replacement; second-scene navigation/state reset; 3,200-task inherited journal restart. Fake transports are explicitly used here. |
| Frozen U01 read-only audit | **5/5 original assertions**, 8 historical calls / 8 historically reported credits | Owner-recorded older contract, not new calls or validation of the current contract. |
| Frozen U02 read-only audit | **5/5 original assertions**, 8 historical calls / 8 historically reported credits | Same limitation. |
| Frozen U03 | **Missing-source sentinel passed** | No model calls; omission remains visible. |
| Actual Clocked HTTP integration | **12 distinct new attempts; 12 completed; 12 reported credits; 0 unknown-credit entries** | Generated fictional materials only. Eight initial calls, four after editing only the second scene. Four unchanged task results retained without a new request. No retries. |
| Explicit live expectation audit | **24/24 field comparisons across all 12 distinct requests** | Both relevance and grant inspected for every passage/scene request. High ≥0.8, low ≤0.2. This is an engineering expectation audit, not preregistered science, calibrated confidence, signature authentication or clearance. |
| Native in-app browser | See cases below | Actual UI controls, file pickers and downloaded files exercised; not merely HTML-string rendering. No screenshots/video/branding work. |

Restricted-shell attempts sometimes denied localhost sockets or immutable-file hard links (`EACCES`/`EPERM`). Authorized local tests/server validation were rerun with those host operations available. The immutable source-vault behavior was not weakened to bypass the restriction.

The final isolated suite completed in **18.0033006 seconds** on Node **v24.13.0**, Windows. The Git export used the host's ordinary checkout line-ending conversion; it contained no private `.env`. The final browser module was reloaded after the template correction and emitted no browser console errors in that check.

## Actual browser cases

1. **No-key evaluation:** opened the isolated server; U01 starts with its honestly labelled historical recording. Replayed U02, explored scene findings, then reset disposable evaluation state. Reset returned the two supplied fictional productions; owner data was never used. Evaluation mode disabled live dispatch and hid private backup recovery.
2. **Cold blank production:** entered an ID/title and pressed Enter; one production created. Imported generated UTF-8 permit text and CSV with two scenes using actual file pickers. Observed **1 document, 2 scenes, 6 planned checks, 0 model attempts**.
3. **Human workflow with AI off:** opened an exact source task and saved a named `NEEDS_SOURCE` review. Recorded a dated scene, added a prerequisite and explicitly confirmed it as `HUMAN_CONFIRMED_NOT_AUTHORITY`. The shared operations view showed **0 open conditions** while retaining the no-clearance distinction.
4. **Navigation:** second-scene action selected that scene; a typed schedule rationale survived switching to Evidence and back. Keyboard project creation worked. Action queues and source review still use the same versioned production state.
5. **Export:** actual JSON download parsed as `beforeroll-complete-production-evidence-v1`: **1 document, 2 scenes, 1 current human review, 0 open prerequisites, 0 model checks, 2 preserved originals, secretsIncluded=false**. Encrypted backup downloaded through the GUI.
6. **GUI recovery:** in a fresh guarded generated-only directory, unlocked with a fictional test owner token, selected that encrypted backup and entered its fictional passphrase. Verification showed **6 tasks, 0 journals, 2 originals, 0 missing originals**. Confirmed the exact ID and restored. Evidence view showed the human review and **2/2 byte-identical originals**. This path made no model requests. Separate HTTP regression restored current plus archived model journals, rejected overwrite/auth/origin/tamper errors, and preserved original bytes.
7. **Honest PDF failure:** tried the supplied image-only generated PDF through normal permit intake. It failed with explicit human-reviewed transcription guidance; document/scene/model counts remained unchanged. No guessed extraction or OCR claim.

The actual browser blank-project path used text/CSV; realistic PDF/DOCX extraction and attested binary paths were covered by generated binary/HTTP tests. No claim is made that the browser independently corroborated a human transcription against arbitrary commercial originals. No real owner's Windows GUI actions have been signed off yet.

## Current provider contract and usage

`scripts/validate-functional-live.mjs` exercised the actual local HTTP execution handler and real Clocked transport. It uses only local `.env` credentials, generated materials, an isolated ignored store, a non-removable-by-script start marker and an explicit maximum of 12 new calls. Re-running it refuses the existing mission marker. **Do not remove the marker to repeat spending.**

All 12 requests completed. Reported credits were exactly 12; this is provider-header accounting, not an independently reconciled account balance or currency invoice. Twelve of the authorized 32 mission requests were used; the unused allowance was not spent.

The issued exception's grant score was **0.9921** for its named scene; the second scene's unissued-request grant was **0.0023 initially / 0.0025 after the schedule edit**. Generic consent and the other scene's exception stayed low for the relevant non-grant cases. All passages and both fields were audited, not only these illustrative values. No model score or human entry was promoted to filming permission.

Raw fictional sources, original bytes, live journals and the receipt remain ignored under `.beforeroll-data/functional-live-20261025/`. They are not committed or reproduced in this report. `scripts/audit-functional-live.mjs` reads those existing journals without loading `.env` or contacting the provider and prints the complete 24-comparison audit. It is expected to require that local evidence directory.

## Architecture and evidence semantics

- One durable workspace remains authoritative. There is no new parallel approval store.
- Model results, human task reviews, documentary links, scene claims, schedules and prerequisites bind the appropriate source/scene lineage. Identical-text reversal is a new revision, not resurrection of earlier approval-like work.
- Exact unchanged model tasks retain original journal provenance and reported cost. UI separates retained attempts from new attempts in the current plan. Summing every entry in every archived journal would double-count retained evidence; use task identity/provenance.
- Historical uncertainty is never transformed into retry eligibility. No automatic retry was added. Restoring a backup makes no provider request.
- Complete JSON export includes current and historical model journals. The current dossier/consistency hash must still match the reviewed workflow. Historical journals are checksum checked, not reauthenticated against missing historical source text or the provider.
- Encrypted backup carries originals; ordinary JSON export lists original hashes and omits binary bytes. Existing-project recovery is refused. Source originals and historical U01/U02 evidence were not rewritten.

## Changed file inventory

Application: `server.mjs`; `public/app.js`; `public/workspace-desk.mjs`; `src/durable-execution.mjs`; `src/intelligence-workflow.mjs`; `src/production-workspace.mjs`; `src/production-dossier.mjs`; `src/source-change-control.mjs`; `src/document-authority.mjs`; `src/scene-authority.mjs`; `src/production-operations.mjs`.

Verification: new `tests/functional-cohesion.test.mjs`; revised `tests/m3s14-pdf-scene-authority.test.mjs`, `tests/m3s23-source-reconciliation.test.mjs`, `tests/m3s24-atomic-production-journey.test.mjs`, `tests/m3s29-owner-security.test.mjs`; new `scripts/validate-functional-live.mjs` and `scripts/audit-functional-live.mjs`.

Reports: this file, `CODEX_GAP_REGISTER.md`, `CODEX_NEXT_OWNER_GATE.md`.

## Remaining limits and next batch

See R01–R04 in the gap register. Prioritize complete register/history pagination and exact-record navigation; then consolidate legacy API replacement contracts and add guarded recovery diagnostics. Expand independent Word/PDF examples and cross-process interruption tests. A 50,000-task ceiling and >3,000-task mocked execution are tested; no thousands-request billable production was run. Exhaustive filesystem failure points and histories near 1,000 archived journals were not exercised. Drafts are session memory, not durable unsaved-work recovery.

No production, model, documentary or operational status establishes legal authority or complete permit discovery. The final GUI owner gate is one procedure in `CODEX_NEXT_OWNER_GATE.md`; no repeated small manual tests are requested.
