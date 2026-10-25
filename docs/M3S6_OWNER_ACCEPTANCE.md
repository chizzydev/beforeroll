# BeforeRoll M3-S6 — Windows owner acceptance v1.0

**Target:** inspect new fictional inputs in real Windows GUI, prove **no fake model outputs**, and optionally carry out one controlled actual Clocked comparison. This document supplies the complete bounded session. The previously accepted M3-S5 package stays untouched.

## Stage A — zero credit: Windows & source coverage

1. Stop the existing BeforeRoll server with **Ctrl+C**. Download `BEFOREROLL_M3_S6_UNFAMILIAR_PERMIT_CHAMPIONSHIP_v0_6_0.zip` to Downloads and extract into a *new* directory. Never merge it into M3-S5. Check the SHA-256 against the hash given with this release.
2. Open a Windows PowerShell terminal in the new application folder and run:

```powershell
$ErrorActionPreference = 'Stop'
npm test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed; stop.' }
node scripts/evaluate_m3s6.mjs --preflight
if ($LASTEXITCODE -ne 0) { throw 'Frozen-science preflight failed; stop.' }
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1'
```

3. Open http://127.0.0.1:3000. The familiar R7 demo appears by default. In **Review desk**, scroll to the **UNFAMILIAR-PERMIT CHAMPIONSHIP** buttons and click **LOAD FROZEN U01 / ARCHIVE FLOOR**. The scene list must show **Scene 47** and **Scene 48**, source terms about wheeled camera platforms/tesserae, and **0/2 scenes assessed for detected clauses only**. Both new scenes must say **NOT AI-EVALUATED**. No Clocked scores should appear; the source comparison explicitly says **AI-OFF BASELINE**. No operator token is required.
4. Click **LOAD FROZEN U02 / PUBLIC EGRESS**. Scene **62** and Scene **63** should load, with text about egress, stalls, a route plan, and a *draft* request. Both **NOT AI-EVALUATED**. This should work with zero Clocked requests.
5. Return to **U01**. Export the Markdown dossier if desired; its provenance must say new case **M3S6-U01**, source mode **manual**, Clocked execution **NOT EVALUATED**. Existing deterministic review questions can appear, but **no Clocked semantic conclusions**.
6. Stop the offline server with Ctrl+C. The offline Stage A is complete. The additional **U03 short-clause sentinel** is exercised by `--preflight`; it is not an eligible live two-scene run and must never create a fake "all conditions reviewed" result.

**Stage A results before owner observation:** local Node 22 suite 83/83 pass, no new provider calls; Windows GUI still pending. Preserve actual screenshots for the accepted owner run.

## Stage B — optional ONE live U01 batch; billable, at most eight calls

This step is **not required** to verify the offline code. Perform only if you authorize up to **8 separately billed** calls (unpredictable charge per call). It uses invented texts, never actual permit documents. This M3-S7 hotfix defaults to an owner-configurable 256-attempt/hour local cap; actual provider rate limits are independent. Two-scene batches remain limited to 8 requests each.

1. In the same application folder, run the live launcher:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1' -Live
```

2. Paste your real Clocked key **only into the local terminal's masked prompt**. Copy the separately generated `LIVE_OPERATOR_TOKEN`; **do not paste the API key into the browser**. Open http://127.0.0.1:3000 and click **LOAD FROZEN U01 / ARCHIVE FLOOR**.
3. Confirm: **Scene 47** and **Scene 48**; four detected clauses, 0/2 assessed, no recorded response; press the button **RUN CLOCKED FOR BOTH SCENES (8 MAX CALLS)**. Paste the **operator token**, read the credit warning and confirm **once**. No automatic retries. No score is assumed in advance.
4. If the batch is complete, observe both scene cards, the Scene Authority board, the restrictions and documentary variation, plus any incorrect, uncertain or missed relationships. Do **not** change the fictional source text before export. Click **EXPORT MULTI-SCENE CLOCKED EVIDENCE (JSON)**; the filename should be `BEFOREROLL_M3S6_U01_LIVE_EVIDENCE.json`. Export **EXPORT DOSSIER** as well.
5. Stop. If the response is incomplete/invalid/failed, retain the partial evidence and **do not retry**. Check the server or error output locally; some calls may have been billed even on failure.
6. In a separate PowerShell window, execute the *read-only* scorer from the original M3-S6 directory:

```powershell
node scripts/evaluate_m3s6.mjs --case U01 --input "$env:USERPROFILE\Downloads\BEFOREROLL_M3S6_U01_LIVE_EVIDENCE.json"
if ($LASTEXITCODE -ne 0) { Write-Host 'M3S6 SCIENCE NEEDS REVIEW; DO NOT CALL THIS A PASS' }
```

7. **Expected scoring:** report each of five *pre-registered* assertions separately. A score of 5/5 is only a narrow **synthetic** pass. Any failure is retained as a scientific discrepancy, not fixed by changing thresholds after the result. Share the audited JSON and dossier only after reviewing for sensitive data; **never share the API key, authorization header or operator token.**

**U01 was independently scored 5/5 on frozen synthetic assertions. U02 may run when the owner chooses, with a newly launched M3-S7 live server.** Do not try U03 live at all. Nothing here certifies authority or grants permission to film.
