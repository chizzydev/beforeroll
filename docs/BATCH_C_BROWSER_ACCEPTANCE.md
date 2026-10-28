# Batch C actual in-app browser acceptance

27 October 2026. Agent-operated rendered acceptance; independent owner Windows acceptance remains pending. Result: PASS for the exercised matrix below. No fresh Clocked calls. This is browser interaction evidence, not a claim based on controller simulations.

## Launch and isolation

`node scripts/serve-batch-c.mjs` launches the existing application over HTTP with a disposable Evaluation runtime and the exact Last Light recording. `--owner` launches a separate disposable, authenticated owner runtime; its random local operator token is stored only in a temporary file outside the repository, entered into the application's password field and removed at shutdown. No production owner store or private documents are opened. A forbidden provider transport counts and rejects any call. The runtimes print close receipts after `stop` and dispose only their own temporary stores.

Codex **actual in-app browser**, browser ID 2, was controlled through the computer-use skill's `cua_repl` APIs: rendered AX state, native clicks, supported Playwright form/selector actions, keyboard actions, screenshots, native file choosers and downloads. The principal final Evaluation runtime used localhost port 53203; the private runtime used 53204. Earlier disposable ports and tabs were retained only as intermediate observations. Frozen campaigns were not replayed to the provider.

Evidence directory: `verification/batch-c-product-experience/browser/`. Screenshots were captured and inspected; downloaded files were parsed and compared separately. URLs contain only fictional production/scene/document/unit context.

## Completed interaction matrix

| Journey / actual controls | Observed result | Evidence |
|---|---|---|
| Cold credential-free opening; Overview → Investigate scene / Scenes | Purpose and actual activities visible; S31 5 prerequisites + 1 investigation, S32 1 + 1 | 28-final-opening-1440.png; 29-final-scene31-1440.png; 37-final-overview-1366.png |
| Switch S31/S32; expand original quotation and provenance | Handling, cradle, transfer protection and conservator tasks stay with S31. Shared venue personnel remains on S32. No fulfilled condition/clearance | 02, 20, 22, 29 screenshots; actual exported 11-evidence.json |
| Work → Source checks; expand documentary records | Five Fill records remain; visible shared-condition disagreement. CS-9 remains investigation; unissued S32 request remains request | 25-fill-records-390.png; 11-evidence.json |
| Read original & provenance → exact unit; refresh; Back/Forward; Return to scene | Exact source unit and context restored; reader focus visible; no wrong-document substitution | 03-source-refresh.png; 27-reader-header-retest-390.png; 38-final-reader-768.png |
| Next human action anchor | Opens containing disclosure, focuses next-human-action, preserves route | Completed final 1366 interaction preceding screenshot 37; source-context regressions |
| Suggestion review → fill → dismiss → reopen → explicit affirmation/save | Visible form, retained session draft, explicit save acknowledgment; human record stays separate | 04-review-draft.png; 06-history-desktop.png; 11/12 actual downloads |
| Exact source review → stage → verify → commit | Conservative S32 source review saved to exact source, production reaches version 4; Work/History/export agree | 09-source-session-390.png; 10-history-rows-390.png; 11/12 downloads |
| Documentary scope → neutral interpretation → invalid blank save → choose REQUEST_NOT_GRANTED → affirm/save | Blank blocked; only explicit conservative fictional human assertion saved; no fulfillment | 05-neutral-scope-desktop.png; 11-evidence.json |
| U01 both comparison directions; Work Open work → exact review | S47/U003 and S48/U004 defaults supported by accepted evidence, original quotes correct; exact form focus | 30-u01-comparison.png/.txt; 31-u01-form.png |
| U01 scope passage selector U001/U002/U003/U004; Back/Forward | Final retest: selector, visible original, URL all agree; interpretation neutral after each context change | **33-u01-final-selector-pass.json** |
| One-document relationship; multi-document original selector | One-document self-link unavailable; target options exclude selected original. No self-amendment written | Actual form observations in 31 JSON/PNG; native self-link/backend regressions |
| Original custody download | Real named download obtained; SHA-256 equals original custody ID | 39-original-download.png; 39-downloaded-Atlas_Correspondence_FICTIONAL.txt |
| JSON complete pack / Markdown evidence report | Real files downloaded, parsed/read. Version 4, 14 assessments, 8 candidates, 23 original journal entries; review rationale present; no filming permission | 11-evidence.json; 12-handover.md; offline preservation gate |
| Private unlock → encrypted backup → wrong-pass verification | Actual encrypted file created. Wrong passphrase produces actionable authentication/verification failure, no restoration | 13-encrypted-backup.json; 14-invalid-recovery.png |
| Valid backup verify → exact-ID separate-copy restore → refresh | Five originals, 23-entry discovery journal, 14 checks and eight candidates preserved; recovered independent version 1 explained | 15-recovered-reload.png; 16-recovered-chooser.png |
| Recovered-copy Lock workspace → reload → unlock | Authentication boundary respected; correct recovered production/scene restored. Same-name chooser distinguishes copy/space | 17-recovered-reauthenticated.png |
| Unavailable production cold deep link → Scenes | Explained choose-production prompt; no silent unrelated fallback | 26-unavailable-production.png/.txt |
| Example controls → U01/U02 | Historical source checks/questions remain; U02 without Extract cards exposes its source investigation | 30; **35-u02-final-visible-investigation.png/.txt** |
| Unsaved suggestion draft → confirmed Reset examples → reopen form | Exact fictional seed restored; unsaved reviewer/rationale blank. Seeded historical fictional review remains labeled | 36-reset-clears-unsaved-draft.png |

The extra human actions are explicitly fictional disposable acceptance records. The original recorded provider answers are unchanged. Suggestion acknowledgment is not authority or condition fulfillment.

## Responsive and accessibility observations

Actual rendered widths: **1440×960, 1366×768, 768×1024 and 390×844**. The viewport capability targets the last-created tab; an early file named `18-work-laptop.png` was actually 390px and is not claimed as laptop proof. Measured values are in `viewport-observations.json`; use screenshot 19/37 for real 1366 proof. Narrow scene selection, comparison, Work/source-review controls, History, Fill records and documentary forms were exercised. No horizontal document overflow was observed in the final measured matrix.

Native controls retain labels and keyboard operation. Form opening and deep links focus visible named content; Tab/keyboard and focus feedback were inspected during the walkthrough. Expanded state is exposed; newly entered recovery panels remain open; dismiss retains drafts until explicit reset. Typography, focus styles, wrapping and reduced-motion CSS remain in the established design system. This is not a screen-reader certification, formal WCAG audit or physical-device test.

## Failures retained and repaired

| Observed defect | Cause / repair | Actual retest |
|---|---|---|
| Scope source selector changed while quotation/route retained prior passage | Draft restoration treated context selectors as editable notes; redundant rebuilding of options compounded stale context. Excluded identity controls from drafts, removed rebuild, synchronize doc+unit route, reset interpretation/affirmation, block mismatched save | Intermediate failures 31/32 remain. Final **33** independently reads all four exact selector/quote/route combinations |
| Reader filename/button overlap at tablet | Header shared constrained row; separate header/action rows and focus spacing | Failed 21 retained; final 27 and 38 inspected |
| Long model task identifiers overflow narrow Analysis | Missing wrap constraints | Final 25 and viewport measurements |
| New recovery disclosure unexpectedly collapsed | Restorer confused newly introduced disclosure with previously closed one | Track known and open disclosure IDs separately; actual recovery 14–17 |
| Unsaved review survived example reset | Volatile draft maps survived server reset | Clear volatile/staged state only after confirmed successful reset; actual 36 |
| U02 source investigation hidden without Extract cards | Compact Last Light hierarchy applied too broadly | Default underlying investigation open when no cards; actual 35 |
| Anchor targeted content inside closed disclosure | Focus helper did not open ancestors | Open containing details before focus; actual next-action sequence |
| Generic next-action copy implied a variation for shared venue condition | Source-independent presenter | Shared exact-source candidate/warning helper; rendered final S32 request copy inspected and native venue/handling regressions |

Initial Windows encoding and mocked-test compatibility failures were corrected before acceptance; failure logs remain in the parent evidence directory. They did not alter frozen evidence. Screenshot 34 is the intermediate U02 state, not final proof. An attempted reload with an unsaved-draft unload guard is not counted as successful refresh; the guard was resolved by explicit fictional reset and final navigation retested.

## Limits and remaining owner gate

No independent owner acceptance, new paid requests, general reliability study, production-store mutation, publication or deployment. Explicit lock/reauth was exercised rather than waiting four real hours for session expiry; automated expiry regressions remain. This increment did not repeat the full new-document/revision live campaign or perform a new same-store OS process-restart acceptance; those features retain accepted historical evidence and complete automated persistence/revision coverage. Invalid-pass recovery was exercised in the browser; corruption/missing-original/journal recovery cases are automated regressions, not new GUI claims. The final owner procedure is reserved until the programme is complete; see the current guide and Batch D handoff.
