# Interactive browser acceptance — closure championship

Completed 26 October 2026 (Africa/Lagos). Engineering source: local commits `ce271b1` and `359f476`, continuing `fa87423`. The previous implementation and reports remain in Git. This report describes actual rendered-browser interactions, not controller mocks or HTTP-only tests.

**INTERACTIVE_BROWSER_ACCEPTANCE=PASS** for the bounded production lifecycle below. No independent unfamiliar human has yet completed owner acceptance. This is engineering acceptance of functionality, not a claim of universal document support or filming authorization.

## Launch and capability

- Windows, Node.js 24.13.0. No new dependencies.
- Private acceptance: `node scripts/serve-closure-acceptance.mjs --live-budget-16`, `http://127.0.0.1:3041/`. It runs the actual application/server with an isolated generated-only store at `.beforeroll-data/closure-browser`. Existing owner productions are never opened. The local API key is read server-side; browser authentication uses fictional test-only tokens.
- The acceptance harness defaults to clearly labelled controlled responses without its explicit live flag. The tested production used the genuine provider transport. A durable dispatch ledger limits this harness to sixteen requests across restarts. Its limit is now exhausted. The separate large-history fixture uses controlled, zero-credit responses and is never represented as real Clocked evidence.
- Evaluation: `$env:PORT='3040'; node server.mjs --evaluate`, `http://127.0.0.1:3040/`. The normal application evaluation entry point supplies its isolated fictional sandbox and disables live Clocked calls and private recovery.
- Browser: Codex desktop **ChatGPT in-app browser**, through `cua_repl`. Used rendered DOM/accessibility snapshots, Playwright semantic clicks and form filling, real file chooser uploads, screenshots, downloads and page reloads. Screenshots were inspected visually. No simulated browser-controller test is counted here.
- This is a single-page application: the actual page URL remained `/`; the seven production stages and research view are application states within that page. Two simultaneous private tabs tested stale export approval.
- Temporary server restarts were exercised. On restart the private session correctly required a new owner unlock. Its four-hour expiry was also encountered during the continued session and required reauthentication. Saved data survived both.

## Fictional material

New production created through the browser using Enter: `lantern_live`, **Fictional Bay Lantern — live acceptance**. Generated fixture files remain local and ignored under `.beforeroll-data/closure-fixtures/`:

- `permit-A.docx`: general filming consent plus a restriction on motor-driven camera supports over a timber deck, requiring a separately issued variation and protective mats.
- `permit-B.docx`: a meaningful stricter replacement requiring a new signed load assessment even with earlier variations and mats.
- `variation.pdf`: an issued Scene 31 variation, followed by an explicitly unsigned/unissued Scene 32 request.
- `scenes.csv`: Scenes 31 and 32 using semantically related electric camera equipment under different conditions.

The generated PDF was independently rendered with Poppler and visually compared with the displayed transcription. Both complete sentences were present and readable. The GUI required a named transcription reviewer and rationale before the PDF source could participate in analysis. This review attests transcription only, not authenticity.

## Completed interactions

| Test | Real controls exercised and observed result | Outcome |
|---|---|---|
| 1. First use | Opened evaluation and private pages; inspected actual layout, intro, production list and step navigation. Created production using keyboard submit. Found excessive initial recovery content, weak purpose wording, and poor stage positioning in a narrow pane. Collapsed optional recovery, clarified the problem/start/Clocked role, and focused the chosen stage. Revisited the resulting interface. | PASS |
| 2. Intake and verification | `CREATE PRODUCTION`; file chooser and `IMPORT PERMIT SOURCE` for DOCX and PDF; original segmented-text disclosures; PDF transcription confirmation; `IMPORT CALL SHEET` for CSV; `SAVE DOCUMENT PROVENANCE`. Observed 2 documents, 2 correct scene rows, 8 planned checks, preserved byte identities and explicit transcription review. | PASS |
| 3. Scene intelligence | `RUN OWNER-AUTHORIZED CLOCKED SESSION` with maximum 8; Scene 31/32 buttons; `OPEN EXACT SOURCE REVIEW`; analysis/source disclosures. Observed eight real completions, eight reported credits and zero uncertain requests. Scene 31's issued variation was model-positive; Scene 32's unissued request remained a review finding, not a grant. General location consent did not override the activity restriction. | PASS |
| 4. Human and operational work | Individually filled exact-source reviewer/rationale on two scenes; `STAGE THIS INDIVIDUAL REVIEW`; `VERIFY STAGED SOURCE REVIEWS`; inspected quotations and version 7; `COMMIT VERIFIED REVIEW SESSION`. Both reviews appeared together at version 8. `RECORD DATED SCENE PLAN` on both scenes, `ADD SOURCE-BOUND PREREQUISITE`, `REVIEW PREREQUISITE`, `SAVE PREREQUISITE REVIEW`. Confirmation changed the open count while retaining no-authority wording. | PASS |
| 4a. Drafts and persistence | Typed an unsaved review rationale, navigated to `Research replay (separate)` and back to `Productions`: exact text survived, then saved. Restarted the application and reopened the saved production: model evidence, human decisions, schedules and prerequisite persisted. Staged a further regression item, attempted opening another production: the switch was refused with guidance and the exact staged item retained. Removed only that disposable item, then navigation succeeded. Browser-crash recovery of unsaved text is not provided. | PASS within session-draft contract |
| 5. Meaningful revision | In `06 Reconcile revisions`, selected BASE and uploaded permit B; `PREVIEW SELECTED PERMIT UPDATE`; inspected source-byte fingerprint, preview hash, version and impact; `IMPORT EXACT PREVIEWED FILE (COMMIT CHANGE)`. Four variation checks remained current, four BASE checks became pending, BASE provenance and its human review became historical. The unchanged variation review and prerequisite remained current. Ran exactly four new genuine checks. | PASS |
| 5a. Source reversal | Repeated Preview/Commit with permit A. Even identical original bytes produced revision 3 and a new source epoch. Observed four retained variation checks, four newly pending BASE checks and no resurrection of the old human review. Ran four fresh checks. A later new BASE review was explicitly recorded; it was not automatically restored. | PASS |
| 5b. Documentary assertions | Recorded Scene 31's exact BASE restriction and Scene 32's exact unsigned VARIATION request through `RECORD ORIGINAL SOURCE → SCENE CLAIM`. Workbench, action queue and dossier retained the request/restriction distinction. No signature or broad authority was inferred. | PASS |
| 6. Evidence/export | `07 Export evidence`; inspected current/historical counts and 4/4 original custody; downloaded `EXPORT COMPLETE EVIDENCE PACK (JSON)` and `EXPORT HUMAN-READABLE REVIEW (MARKDOWN)`. Read both files. Version 18 included 8 current model checks, 2 current human reviews, 1 historical human review, 2 archived model runs, dated scenes and the confirmed prerequisite. Remaining human work was plainly listed, not hidden. | PASS |
| 6a. Stale export | Tab A held version 17's dossier. Tab B saved renewed documentary provenance, creating version 18. Tab A's JSON export was refused: “Export evidence changed since the reviewed workflow snapshot. Refresh the project and inspect again.” Reloaded and downloaded the current export successfully. | PASS |
| 7. Backup failures | `EXPORT PRIVATE LIFECYCLE BACKUP (ENCRYPTED)` with generated test-only passphrase. Selected backup in recovery file chooser. Wrong passphrase rejected with actionable guidance and no restore. Flipped a ciphertext byte in a separate copy, uploaded it with correct passphrase: also rejected. The app correctly did not pretend it could distinguish wrong passphrase from ciphertext damage. | PASS |
| 7a. Complete recovery | Re-selected unmodified backup; `VERIFY ENCRYPTED BACKUP` showed 8 tasks, 3 journals, 4 originals and 0 missing. Typed exact production ID; `RESTORE VERIFIED PRODUCTION` created a separate recovered copy alongside the untouched original. `CHECK STORAGE AND RECOVERY HEALTH` reported verified journals, missing originals 0, absent locks, no retries. Exported the recovered pack; read-only comparison established exact equality of workspace, all journal records and original-file inventory. Inspected exact recovery receipt through history. | PASS |
| 7b. Recovery selection regression | Reopened recovered operations and clicked `REVIEW PREREQUISITE`. Found an OPEN default incorrectly replacing the saved confirmed status. Fixed both selected-status rendering and prerequisite-scoped draft identity. Reloaded and repeated the same click: selected value was `HUMAN_CONFIRMED_NOT_AUTHORITY`. Saved screenshot 13. | PASS after fix |
| 8. No-credential evaluation | Opened Archive example, navigated Scenes 47/48 and exact sources, saved a fictional review, saw it in the integrated report. Clicked `REPLAY U02 RECORDING`, inspected Scenes 62/63 and older-contract provenance. Live analysis/private recovery were unavailable. Reset's native confirmation was unreliable in this browser; replaced it with `RESET EXAMPLES` → inline `CONFIRM FICTIONAL RESET` / `KEEP EVALUATION EDITS`. Confirmed reset: both supplied examples returned to version 1, temporary review disappeared. No billable calls or private owner data. | PASS after fix |

## Complete GUI history acceptance

Opened **CONTROLLED HISTORY FIXTURE — 107 reviews and 65 prerequisites**, whose seeded records are explicitly generated test data. Used `BROWSE COMPLETE EVIDENCE HISTORY`, type/state filters, search, `FILTER HISTORY`, `NEXT HISTORY PAGE`, exact `INSPECT HISTORY RECORD` and selected-record inspection.

Observed page 2 and complete totals for **107 reviews**, **50 model entries (25 runs + 25 attempts)**, **26 source imports**, **107 scope claims** and **131 operational records**. Review 21 was selectable beyond the first page; searching `Generated historical review 106` returned exact review 107; CURRENT showed the four latest task decisions. Historical/current labels and stable identities were visible. Recovery history in the actual restored production showed its verified receipt. Each page explicitly says it is not the complete history.

Long hashes originally overflowed the narrow pane. Evidence text now wraps; the final recovery receipt and subsequent screenshots were readable. Searched for generated prerequisite 0, which is outside the latest-50 register, inspected it and clicked `OPEN CURRENT PREREQUISITE REVIEW`. The final UI showed its exact title, Scene 31, identity and saved confirmed decision (screenshot 14).

## Evidence files

All paths below are under `_codex_mission/evidence/closure/`; `manifest.json` records their sizes and SHA-256. They contain fictional data only. Working backups, downloaded production packs and fixture originals remain ignored locally.

| File | Meaning |
|---|---|
| `01-first-use.jpg` | Initial first-use observation, before functional content/navigation corrections. |
| `02-created-production.jpg` | Actual new-production creation checkpoint; also shows the earlier overly prominent recovery form. |
| `03-genuine-eight-checks.jpg` | Eight genuine checks completed; retained credit/attempt accounting. |
| `04-selective-invalidation.jpg` | After permit replacement: 8 planned checks, 4 recorded retained checks, renewed current review work. |
| `05-history-page-two-record-21.jpg` | Exact selected historical review 21; captured before hash-wrapping correction. |
| `06-stale-dossier-blocked.jpg` | Actual stale export refusal after a change in another tab. |
| `07-wrong-passphrase-guidance.jpg` | Failed verification and explicit no-restore guidance. |
| `08-recovered-evidence.jpg` | Successful recovered evidence/custody and journal health. |
| `09-recovery-receipt.jpg` | Complete receipt: 3 journals, 4 originals, no missing originals, separate-copy identity. |
| `10-evaluation-recorded-findings.jpg` | Genuine recorded U02 evidence labelled older request contract. |
| `11-evaluation-reset-complete.jpg` | Inline reset completed and fictional examples restored. |
| `12-staged-session-protected.jpg` | Uncommitted review prevented from disappearing on project switch. |
| `13-confirmed-prerequisite-selection.jpg` | Original failing prerequisite selection retested successfully. |
| `14-older-prerequisite-context.jpg` | Older current prerequisite opened from complete history with exact title/scene/decision. |
| `15-final-recovered-dossier.jpg` | Final committed server restarted; recovered dossier and storage/journal health independently reopened successfully. |
| `live-audit.json` | Read-only audit of all 16 new genuine requests, both model fields, source identities, charges and exact recovery comparison. |
| `engineering-verification.json` | Baseline/final test totals and preservation checks. |

## Limits and what was not claimed

No blocking interaction remained in this exercised journey. Not every possible input file, every control permutation, browser/OS combination, filesystem failure point or near-cap archive history was exercised interactively. Historical identities absent from legacy journals are explicitly unknown; new journals preserve scene/document manifests. Tests cover bad custody, lock fences, tampered journals and unknown billing; actual power loss during a genuine request was deliberately not induced. Unsaved drafts are memory-only, with a close/reload warning; saved work and staged atomic commits are the persistence boundary. Native before-unload dialog appearance was not separately certified across browsers.

Full visual redesign, public deployment, GitHub publication, marketing and hackathon submission were not undertaken.

Final smoke check restarted the acceptance server from `359f476`, renewed its owner session, reopened the recovered copy and verified the dossier and custody/journals again. It still reported 8 current model checks, 2 current human reviews, 1 historical review, 2 archived runs and zero missing originals. No additional dispatch occurred. Temporary acceptance servers were stopped after evidence collection; generated local stores remain for audit.
