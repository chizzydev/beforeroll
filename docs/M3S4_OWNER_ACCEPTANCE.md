# BeforeRoll M3-S4 v0.4.0 — Windows owner-acceptance contract

## Scope

This release integrates **two distinct original call-sheet rows** with source-bound Clocked Decide assessments. The permit is split into source candidates by deterministic punctuation segmentation; every detected candidate is separately assessed against each original scene row. A bounded batch is max **2 scenes × up to 4 clauses = 8 billable requests**, strictly sequential, with no retries. This pilot does not infer legal permission or supersession across documents.

**No real production documents:** only fictional, synthetic examples. It is not a film authority and cannot authenticate an issuer, signer, insurance or real-world compliance. Original source and decision hashes are tied to the reviewed packet. Owner-run live evidence is required to assess whether model findings are correct for the new second scene.

## Stage A — recorded offline Windows run (ZERO Clocked credits)

1. Stop an old BeforeRoll server and launch this complete new folder using `scripts/Run-BeforeRoll.ps1` (no `-Live`). Open http://127.0.0.1:3000.
2. On Review desk, click `LOAD TWO-SCENE SOURCE DEMO (31 RECORDED / 32 NOT EVALUATED)`. Expect **2 scene rows**, **MULTI-SCENE COVERAGE 1/2**, and Scene 31 marked **CLOCKED CHECKED** using original owner-recorded M3-S2 results. Scene 32 must say **NOT AI-EVALUATED**, not a guessed review finding.
3. Scene 31 retains the original atmospheric-vapor restriction and the **conditional SV-31** for that scene (no clearance). Selecting it displays exact permit/scene evidence. Click Scene 32. Its model area must state **No AI finding has been inferred**; the deterministic baseline remains active but does not grant permission.
4. Export the Markdown dossier. It must explicitly record `Scene 31: EVALUATED ...` and `Scene 32: NOT EVALUATED`, distinct source quotations, and provenance attributing the synthetic recordings to **R7 Extract** and **M3-S2 Decide**, rather than claiming all results came from R7.
5. Source intake: change the permit text and click `APPLY TEXT / CLEAR OLD EXTRACT`. Check both scene model results are **NOT EVALUATED**; old findings and batch status are cleared. No stale model result may survive.

## Stage B — one separate controlled live batch (owner opt-in)

1. Restore the two-scene demo; stop server and start with `scripts/Run-BeforeRoll.ps1 -Live` (the key is entered locally and never printed). Record the separate `LIVE_OPERATOR_TOKEN` privately. Do not share it.
2. On Review desk with two original unedited scenes, paste that token in **Operator token**, not the API key. Select Scene 31 or Scene 32; the batch button scans **BOTH**, regardless of selected scene.
3. Confirm `RUN CLOCKED FOR BOTH SCENES (8 MAX CALLS)` once. The server requires all 8 capacity slots before any network requests; one HTTP request initiates at most 8 sequential Clocked Decide calls (each billable). The charge per call is **unknown**, and no input controls a guaranteed per-call cost limit. No automatic retries. An upstream failure stops the remainder, flags incomplete, and leaves unattempted scene(s) **NOT EVALUATED**. Do not retry a partial batch merely because output was missing; billing can be unknown.
4. Inspect both scene-specific findings. For Scene 31 the application should be capable of identifying the general vapor prerequisite and a conditional scene-specific signed variation. For Scene 32, **no Scene 31-specific grant may be treated as documentary authorization** merely because an atmospheric effect is similar. These are **expectations, not confirmed new model outcomes**. Record what Clocked actually returns; no score is proof of authority.
5. Export `BEFOREROLL_M3S4_LIVE_TWO_SCENE_EVIDENCE.json` and the Markdown dossier. Review both for sensitive information before uploading them. Confirm each result contains original source text/offsets, per-scene request hashes and reported/unknown credit accounting. Never include credentials or operator tokens.
6. No additional API runs unless a new bounded experiment is deliberately authorized.

## Hard gates

- Two original scene rows cannot share an ID or be silently merged. Corrections invalidate previous model evidence and require human sign-off.
- More than 8 total model calls, >2 scenes, unsupported rows, changed original source or bad hash/offset must be rejected before any inference is attached.
- Missing model output is `NOT EVALUATED`, never `CLEAR`; a conditional documentary grant is not certification that its prerequisites are satisfied.
- Explicit signed variations are treated as candidate evidence. The code does **not** resolve document precedence/authority automatically.
- The supported format is simple text and `Scene n | Location | HH:MM-HH:MM | Activity`. PDFs, OCR, tables, arbitrary document authority and broad multi-scene scale are still not implemented.

## Owner acceptance record

The automated tests and offline Chromium fixture harness exercise implementation mechanics; **Windows Chrome/Edge GUI owner testing and live provider results have NOT been performed as part of packaging**. Report results exactly, including errors or partial responses.
