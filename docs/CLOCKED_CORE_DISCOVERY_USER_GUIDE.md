# Owner documentary review discovery

## Current extension: Last Light and documentary investigations

Revised Batch B integrated optional Clocked Fill status/reference investigations and a complete genuine Last Light recording inside existing Evaluation Mode. See [the current Last Light guide](LAST_LIGHT_USER_GUIDE.md) and [the Batch B evidence report](BATCH_B_THREE_ENDPOINT_HERO_REPORT.md). The new campaign used 39 requests/150 reported credits and is closed; it does not reopen the prior campaign. The installed no-key launcher now opens Last Light, with U01/U02 retained. No generalized reliability or independent owner GUI acceptance is implied.

In private Analysis, the Fill checkbox adds explicitly reserved documentary reads to the exact scope preview. These classify source claims and references, never actual issuance, authenticity, global supporting-evidence absence or fulfillment. Analysis exposes every recorded typed result, skipped-unit counts and scope disagreements. Suggestions remain separate from human authority/operational decisions.

The original core delivery/cold-run procedure below is retained as historical engineering context; do not rerun a consumed experiment or interpret its earlier no-recording limitation as the current product state.

The subsequent authorized live campaign passed six frozen fictional cases after repair: **57 real requests, 102 reported credits**, with exact source-bound evidence. See [the live validation report](CLOCKED_CORE_LIVE_VALIDATION_2026-10-27.md). This establishes bounded development behavior, not generalized reliability. The completed campaign is closed and must not be replayed. The original owner cold-run procedure below is retained for future separately authorized cases; no repeat owner testing is required to complete that campaign.

## In the existing private application

1. Use the existing private launcher and owner unlock. Create/open a fictional production, import its original permit and call sheet, and check the original file identities and normalized transcription. Complete the existing PDF transcription review if required. Originals must remain in the private source vault.
2. Open **Analysis → Discover documentary review tasks**. Choose documents and scenes, name the source verifier, acknowledge source identity and set a bounded request/credit reserve. You never select individual clauses or write extraction questions.
3. **Preview discovery · no calls** inventories every selected scene × source unit, revisions/hashes, maximum Decide/Extract calls and concurrency one. The current cap is 128 requests per scope; choose a smaller document/scene scope if necessary. The separately guarded first cold-run command below caps itself at 32.
4. A separate, explicit owner decision is required before using **Authorize bounded Clocked discovery** with the local operator token. Never enter the Clocked API key in the browser. The server uses its existing private configuration.
5. Refresh discovery status to inspect progress or stop before the next dispatch. A running request can finish after Stop. The journal survives restart; a stopped/interrupted scope has no retry or resume control. Do not delete journals or locks to bypass a fence. Changing selected scenes cannot bypass an uncertain overlapping request.
6. Inspect every pair, including negative, ambiguous, quarantined and unassessed records. Accepted quotes appear as separate review suggestions in the existing **Scenes** and **Work** surfaces. Open the original/provenance and record a suggestion review there. Suggestion review does not close source questions, confirm fulfillment, authenticate authorization or grant clearance.
7. Dossier JSON/Markdown, History and encrypted lifecycle backup retain current/historical discovery and suggestion reviews. Download private raw request/response receipts from Analysis. A source or scene revision retires the affected scope; reversing text cannot revive its previous epoch. This increment conservatively retires the entire selected scope when one selected source/scene changes.

The legacy Decide-only execution remains available, with its original contracts, findings and accounting. New discovery has a separate journal and progress count; it does not pretend the old Decide-only journal was executed. All original source/scope/operational reviews remain required. Uncertain overlapping discovery requests block the legacy route too.

## Honest limits

- The credit reserve is an owner limit for planning and stopping, **not a provider-enforced price ceiling**. One returned charge may exceed it. Missing or excessive reported cost stops subsequent requests. Provider quota can change after local preflight.
- Relevance uses the exercised two-question Decide contract. Extraction uses the exact accepted three-field uniform instructions. Neither authenticates documents nor proves relevance is correct. An ambiguous or negative link can miss an obligation; it remains inspectable manual review.
- Explicit other-scene, historical and proposal cues quarantine tasks. This lexical safety fence is incomplete and may suppress valid obligations. All remaining candidates still have unverified applicability, issuance, authenticity and fulfillment. There is no automatic assignment of verified duties.
- All selected units are inventoried, but full legal/semantic coverage is never claimed. Extract runs once per positively linked unit; empty fields do not exonerate a scene.
- Private evidence stores exact response bytes (bounded at 2 MiB per response; an oversized/broken stream is incomplete). Credential echoes are encrypted and rejected. Never publish private receipts without inspecting them.
- Evaluation Mode now includes the integrity-pinned whole Last Light run and preserves historical U01/U02 replay. It cannot dispatch fresh Clocked requests. Edited sources/scene/contracts cannot reuse the frozen run as current.
- A successful stopped scope cannot be resumed with the same fingerprint. There is intentionally no automated recovery/retry of billable work. A different explicitly authorized scope may repeat known completed requests; its preview reserves the full cost again.

## One coordinated Windows gate

Run this **network-free engineering preflight** in PowerShell from the established repository:

```powershell
Set-Location 'C:\Users\HP\beforeroll-codex-phase1'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Clocked-Core.ps1
```

For a cold run, independently choose an unfamiliar **fictional UTF-8 text permit** and supported call sheet, outside this repository. Before seeing any model output, write the expected key duties, correct scenes, irrelevant/historical/proposed passages and failure criterion in your own reference notes. Do not use an old U01/U02 permit or the controlled engineering example. Verify the original text yourself. This is owner acceptance of one new case, not a sealed championship/test-set construction.

Start the existing `Start-BeforeRoll-Private.cmd`; use its actual loopback address (the launcher chooses a free port). Prepare the new production and preview **without Clocked calls**:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-Clocked-Core.ps1 `
  -BaseUrl 'http://127.0.0.1:REPLACE_WITH_PRIVATE_PORT' `
  -ProductionId 'independent_cold_run_01' `
  -PermitPath 'C:\YourFictionalMaterial\fresh-permit.txt' `
  -CallSheetPath 'C:\YourFictionalMaterial\fresh-call-sheet.txt' `
  -Reviewer 'Your name' -SourceIdentityVerified `
  -EvidenceDirectory "$env:LOCALAPPDATA\BeforeRoll\independent-cold-run-01"
```

The directory and production must be new. It prompts securely for the **local owner token**, imports through the real application, and writes `approval.json` containing the exact preview. It reserves at most 32 calls and 128 reported credits using a four-credit per-call reserve. If the complete scope exceeds either bound, preparation fails rather than silently selecting clauses. Inspect the preview against your original files and reference notes. A failed partial preparation can leave an unbilled fictional production; do not overwrite it.

**STOP HERE until separate owner authorization for the first live test. Codex has not run the following command.** After authorization only:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-Clocked-Core.ps1 `
  -BaseUrl 'http://127.0.0.1:REPLACE_WITH_PRIVATE_PORT' `
  -ApprovalPath "$env:LOCALAPPDATA\BeforeRoll\independent-cold-run-01\approval.json" `
  -AuthorizeLive
```

It requires typing `RUN_CORE_DISCOVERY`, securely prompts for local owner/operator tokens, re-verifies the exact preview and creates a durable client intent before asking the existing server to run. The API key stays server-side. There is no retry on lost response or ambiguous dispatch. A server restart leaves request intent fenced, even if the client times out.

Review `discovery-evidence.json`, `discovery-projection.json` and `semantic-review-required.md` in that private directory. Record all/assessed/unassessed pairs, matched links, literal spans, wrong-scene or unsupported candidates, actual reported costs and missing costs. Compare against the notes written **before** dispatch. Any missed key duty means **FAIL**; do not change the reference after seeing output. Incomplete/uncertain execution is not a semantic PASS. Report the result before proposing further live runs. No production deployment or generalized reliability claim follows automatically.

No GUI walkthrough or owner GUI acceptance is claimed by this engineering gate. Existing BR-01–BR-18 issues remain outside this increment.
