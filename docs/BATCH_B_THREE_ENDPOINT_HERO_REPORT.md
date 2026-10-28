# BeforeRoll — revised Batch B v2.0 delivery

27 October 2026 · **BATCH_B_THREE_ENDPOINT_HERO_PASS**

This is a bounded functional pass for the fictional Last Light packet and the tested application lifecycle. It is not universal model reliability, documentary authentication, filming clearance, independent owner GUI acceptance or submission readiness. Batch C has not started.

BeforeRoll now carries the same source-bound workflow through **Decide → Extract → Fill → review → History/export/recovery**, and its complete genuine recording is available without credentials inside the existing Evaluation Mode. Fill has earned its place: it distinguishes the narrow claimed variation from the wider unissued request, identifies their references and investigation targets, and prevents a cited schedule from being mistaken for an imposed prerequisite.

There is a disclosed remaining **advisory scope disagreement**: Fill names only S31 for the general venue condition, while Decide and the source support review for both scenes. Both venue-personnel tasks remain present through their independent Decide/Extract bindings. Analysis visibly flags the disagreement; the Fill target list is not represented as exhaustive. This informational model limitation does not remove a required task or create authority.

## 1. Baseline, authorization and preservation

Read the accepted Batch A report, complete core implementation/architecture/guide/live-validation report, prior campaign manifest, U01 coordinator report and original BR-01–BR-18 register. Inspected the actual planner, two-question request builder, literal decoder, durable journal, authentication, views, history, exports and recovery. Accepted the owner's development chronology clarification; no eligibility reinvestigation was undertaken.

The independent starting native run passed **607/607**, zero failures/skips/cancellations, 20,982.1094 ms. A sandboxed attempt failed localhost operations with `EACCES`; the normal approval path permitted the isolated local tests. The pre-edit source/Git inventory is `verification/batch-b-last-light-20261027/baseline.json`. Existing unrelated owner changes remain. No Git mutation, deployment, dependency installation or CSS modification was performed.

The previous 57-request/102-credit campaign was not rerun, reset or rescored. Offline integrity verification checked **115 old evidence files plus five protected references: 120/120 matched**. These include the original request builder, engine, source segmenter, U01 literal recording and BR register. Old `sourceFiles` hashes describe the earlier source version; affected production source has legitimately changed in this increment, while the frozen campaign artifacts/manifest remain unchanged. The original E failure remains intact.

The new campaign is `verification/batch-b-last-light-20261027/`. Its owner-authorized ceiling was **80 fresh requests or 400 provider-reported credits**. Actual use was **39 requests / 150 credits**; no uncertain response or unknown cost occurred. No retries were made. The campaign closes with **41 requests / 250 credits unused**. Credits are provider units, not currency.

## 2. Fill research and the actual contract

Read the current official pages in the **Codex in-app browser**, including the complete recorded Fill example. These are undated living references, accessed 27 October 2026:

- [Fill request/response and field controls](https://clocked.rezolve.ai/docs/fill).
- [Unicode source positions, probabilities and credit headers](https://clocked.rezolve.ai/docs/responses).
- [Errors, retries, timeouts and partial execution](https://clocked.rezolve.ai/docs/errors).

Fill accepts text and 1–64 typed fields with up to 20,000 shared instruction characters. Types are `extract`, `choice`, `multiselect`, `score`, `yes_no`, and explicitly generative `generate`. Choice supports 2–255 labels; multiselect supports 2–64 independently evaluated labels; scores use 2–10 ordered levels. Extract supports literal source reads, optional list/region/sentence controls; inference defaults **true**, so every source-read field here explicitly sets **`infer:false`**. No generation is used. Native-image results lack the text offsets required by this integration and are rejected.

Raw HTTP returns `model`/`fields` directly. Fields carry type-dependent values and optional diagnostics/confidence/probabilities. Null source reads do not establish absence across a production. Non-null literal values in BeforeRoll must have exact zero-based Unicode codepoint `[start,end)` ranges in the submitted original unit and its containing original document. Confidence is not authenticity, legal applicability or calibration. Unused diagnostic keys are not globally required.

The documented billing header settles the request at 25 model milliseconds per credit, rounded up with a minimum of one. Token usage and summed optional timing keys are not debit. There is no fixed documented price for this schema. Safe credit/model-time/cost-basis/transport headers and round-trip timing are retained. Provider SDK retry guidance does not override the application's stricter unknown-outcome fence. No retrying SDK wrapper or Pipeline endpoint was added.

Final production definition: `src/documentary-fill-contract.json`; builder/validator: `src/documentary-intelligence.mjs`. The effective contract fingerprint is:

`5f0ff420b63f7f6460b0e48c34f7f7cee5a5da6821d4e589c46053d8416fa694`

This hashes the effective static definition plus scene-scope version 6. Each concrete request also hashes the selected exact scene rows and focal original text. The final canonical file produces the **same accepted v6 payloads**; earlier prototype source definitions are archived under `development-contracts/`, and every earlier concrete request remains frozen in its original versioned packet.

| Output | Actual field type | Meaning and boundary |
|---|---|---|
| `claimed_role` | choice | `claims_issued_variation`, `request_only`, `historical_reference`, `current_condition`, `unrelated_or_unclear`; a source/model interpretation, never authenticated issue |
| `claim_quote` | extract, infer false | Complete focal original statement, preserving limitations, negations and historical wording |
| `referenced_instrument` | extract, infer false | One explicitly referenced supporting instrument, or null; no assertion that the entire production lacks it |
| `scope_quote` | extract, infer false | Original activity/scope wording, or null |
| `scene_scope` | choice | One selected scene, all selected scenes, or scope not established; model-suggested investigation target, not permission |

The choice contract cannot enumerate every arbitrary subset of a large multi-scene scope. Sources needing an unresolved partial subset require manual review. The tested hero has two scenes. Supporting-evidence availability, authenticity, actual issuance and fulfillment are deterministic **UNESTABLISHED/UNVERIFIED** states awaiting human evidence—not model booleans pretending to verify the world.

Strict validation rejects missing/extra fields, invalid enums/types/confidence, generated/inferred quotations, nulls with invented spans, wrong document/unit identities, source/request/hash mismatches, out-of-range or altered quotations and explicit status contradictions. Accepted raw responses remain revalidated at journal load, projection and recovery. Partial/invalid records halt the bounded job; no subsequent automatic requests or automatic retries occur.

## 3. Frozen value test, failures and integration decision

Before any Batch B response, froze originals, scene activities, six expected prerequisites, four documentary-role cases, preferred claim/reference/scope anchors and ranges, complete unit inventory, prohibited assertions and comparison criteria. Initial freeze SHA-256:

`38994b2b781d4d31445e08ec1dd49677f67d4a3d8caf30f371cf0a0516bda55a`

The original gold and source bytes were never changed after results. Unique expected prerequisite phrases plus the original frozen bytes fix their numeric ranges; `final-comparison.json.expectedSpanDerivation` materializes those ranges deterministically without consulting model answers. Role anchor ranges were explicitly stored in the initial freeze. Alternative exact quotation boundaries were allowed by the preregistered semantic-equivalence rule; missing quotation evidence was not accepted.

The first requests exposed real problems. Every original response, intent and verdict remains:

| Request version | Actual new calls / credits | Outcome and response |
|---|---:|---|
| v1 | 1 / 5 | Correct current-condition role/reference/target, but required quotation null; rejected and halted |
| v2 | 1 / 5 | Quotation fixed; independent multiselect returned both S31 and abstention. The application contract had incorrectly treated independent labels as exclusive; rejected |
| v3 | 3 / 16 | Condition and variation passed; request correctly classified but target empty; halted |
| v4 | 3 / 15 | Request target included both scenes; unsafe over-association for the frozen target expectation; halted |
| v5 | 4 / 18 | Exclusive choice fixed the request target; historical record's quotation was null; rejected |
| **v6** | **4 / 29** | **All four frozen cases passed** with exact source reads, correct role/reference and the registered scene target |
| **Value-gate total** | **16 / 88** | Adaptive development on an exposed packet, not an independent held-out accuracy study |

Repairs were generic: remove mutually exclusive abstention from independent multiselect; use an exclusive target choice; distinguish a proposed change's target from the current planned activity; make the literal evidence field independent of another field's selected label. A null historical quotation was never manufactured. Complete focal-statement copying solved that evidence-read failure while retaining the separate role/reference/target contribution.

All responses were HTTP 200 from `clocked-1.0`; the failures were typed/application-contract or semantic acceptance failures, not HTTP schema rejection. There were **five failed attempts** among the adaptive gate requests; they remain failures. The accepted four-request v6 packet is `fill-v6-freeze.json`, SHA-256:

`876d6f2073c900b085d40c64c4d32a11bcb419c1d9f037e9f2f5ccff7b75e088`

**Decision: integrate Fill, bounded and review-only.** It adds documentary interpretation absent from the original two probabilities/three literal lists. The production implementation does not add Fill to every scene-pair call: it plans at most one Fill per automatically eligible documentary unit, after Decide and relevant-unit Extract. The transparent routing screen includes documentary/status/reference cues; skipped units remain explicitly counted, never declared irrelevant or legally complete.

## 4. Last Light originals and expected versus observed work

All files are visibly fictional, imported through actual browser file controls into a new isolated authenticated production, `last_light_browser_01`. Original SHA-256 values:

| Original | Units | SHA-256 |
|---|---:|---|
| Venue access | 1 | `386307e2e6d43bef9aa4a7f61a621aa8265afbc4d1947705eb6f65cccdeb58a8` |
| Lender conditions / claimed variation | 2 | `1b07a56aed1609c76e214305e7c383ec2510f0ca2d2777665b6916c5e85f3699` |
| Unsigned request / condition history | 2 | `84a73428f0658e39aadfb639526faa33055f0423a4f8c8ee3b18cc03dfe2beb7` |
| Visitor information | 2 | `c9d20195dd66874c0236250f52ca0335d1230a25db6ced52ea9304b8b92a2b7b` |

The original call sheet and its hash are retained in the freeze and recording. S31 plans an actor opening/unfolding the borrowed atlas; S32 plans a case-only interview. Conditions use natural activity wording, not hardcoded S31/S32 references. The supporting CS-9 document is referenced but not supplied; the application asks the coordinator to locate/verify it without claiming a complete external evidence inventory.

| Scene | Final expected/observed prerequisite |
|---|---|
| S31 and S32 | `venue duty officer`—two independent scene-bound tasks |
| S31 only | `written lender consent` |
| S31 only | `supporting book cradle` |
| S31 only | `padded transfer tray` |
| S31 only | `collections conservator` |

**Final: 6/6 expected prerequisites, zero omitted, zero unsupported, exact spans.** Two additional documentary investigations:

- S31: verify the **claimed** narrow variation and locate **Consent Schedule CS-9**.
- S32: investigate the unissued broader handling request referencing **Variation VA-17**.

The historical foam wedge/volunteer does not become a current duty. The handling protections/personnel do not transfer to S32. Zero authority records and zero operational fulfillment decisions were created. One scripted **fictional browser review acknowledgment** was saved; it is neither an independent owner decision nor permission to film.

All seven original units are accounted for across **14/14 assessed scene-unit pairs**, with zero unassessed pairs, six relevant signals and one ambiguous signal. Four units received Extract; five eligible documentary units received Fill; two visitor units were explicitly skipped by the documentary screen. Full text inventory is not complete legal authority or proof that the relevance model missed nothing.

The four preregistered role/target cases passed the accepted contract and production evidence. The fifth, general venue Fill record has the scope under-coverage described at the start of this report. **Do not describe all five scope readings as correct.** The UI exposes all five typed records and flags the disagreement; the two venue prerequisite tasks remain correct independently.

## 5. Actual application run and causal comparison

The principal run was initiated through rendered controls: create → four permit imports and call-sheet import → source comparison/inventory → explicit verifier and unbilled preview → operator-token/billing acknowledgment → bounded authorization. No clause IDs or bespoke extraction questions were selected. Actual plan: 14 Decide, up to seven Extract, five Fill, maximum 26 calls, concurrency one. Actual run: **14 Decide + four Extract + five Fill = 23 requests / 62 credits**.

Raw receipts are in the application discovery journal, complete evidence export and campaign budget ledger. The API key stayed server-side. An ephemeral separate owner/operator token protected the fictional test server; unauthenticated browser entry required unlock. Actual owner workspace data was not used.

| Configuration | Useful result | Unsupported/uncertain work | Requests / credits / recorded transport time |
|---|---|---|---|
| A: AI off | Actual deterministic source processing, originals, scene register and 14 manual source checks remain; zero new model-derived tasks | Coordinator manually discovers obligations/status/references; no fabricated model substitutes | 0 / 0. Audit CPU projection timing is recorded separately, not coordinator time |
| B: Decide + Extract | All six expected prerequisites after the generic history-fence repair | One unsupported *prerequisite* classification: CS-9 is cited, not expressly imposed; no typed request/variation investigation | 18 / 30 / 11,913.4532 ms |
| C: plus Fill | Six correct prerequisites **plus two typed investigations**; cited CS-9 retained as documentary investigation rather than imposed duty | Zero unsupported final prerequisites; one advisory venue scope disagreement and one ambiguous Decide signal remain explicit | 23 / 62 / 15,467.7490 ms |

B is a **read-only ablation of the same genuine Decide/Extract receipts**, not a separately dispatched paid run. `scripts/audit-batch-b-results.mjs` revalidates those matching request bodies and computes the two-endpoint projection without persisting a fictitious journal. No new requests or independent runtime trial were invented. Incremental Fill cost in the hero was **five requests / 32 credits / 3,554.2958 ms** of measured application transport time.

The reference name CS-9 was already visible to B—incorrectly promoted to a prerequisite. Fill's gain is **status, target and correct investigation type**, plus the separate S32 request investigation, not the false claim that only Fill could find those characters. AI-off retains all useful manual/deterministic functions. No coordinator time savings, fewer incidents or real-world accuracy percentage was measured.

## 6. Live-discovered defects, preserved failures and repairs

The first full application result is preserved as `initial-browser-run-*` plus browser checkpoint 03. It had two correct venue tasks, four omitted handling tasks and one unsupported CS-9 prerequisite, alongside the two useful Fill investigations.

1. **Historical-object suppression:** `scopeCaution` required an explicit scene number to recognize current directives about a historical object. Natural activity-based current requirements were quarantined. Generic repair permits current directive language without scene labels while retaining past/narrative/proposal fences. Revalidated the unchanged real responses; all four omitted tasks returned. No U01/atlas keyword rule or response substitution.
2. **Reference versus prerequisite:** Extract returned CS-9 although the passage only cites it. Fill's claimed-variation record plus absence of imposed-condition wording quarantines that classification, preserving the quote/reason and creating the proper documentary investigation. The two-endpoint ablation still exposes the false prerequisite honestly.
3. **Disconnected model presentation:** Scenes/Analysis/Overview/Exports still displayed legacy `NOT_ATTEMPTED` or 0/14 despite discovery. Displays now recognize accepted discovery evidence while preserving separate legacy journals/counts. JSON complete packs explain counter semantics; Markdown distinguishes effective assessments from legacy metrics. No fake legacy completions.
4. **Review usability/context:** opening a suggestion review now focuses the visible form; dismissal explicitly keeps the draft; actual reopen retained text. History derives source context from the immutable suggestion-review source, avoiding the misleading legacy-context warning for new records.
5. **Recovery accounting:** preview omitted discovery journals from its total. Added explicit discovery/total counts; actual retest shows one Clocked journal/one discovery, five originals and safe existing-copy guidance.
6. **Evaluation reset confirmation:** its disclosure collapsed on render. Added a stable disclosure identity; actual retest shows confirmation immediately without reopening the menu.
7. **Backward compatibility:** optional Fill-only projection fields are absent from older two-endpoint jobs. A new regression compares all six prior complete projections against their archived dossiers exactly, guarding legacy evidence/backup receipt interpretation from gratuitous shape changes.
8. **Documentary presentation:** Fill requests are labeled investigations, not underlying restrictions, and no empty/invented Decide receipt is shown for a Fill card. All five typed records, original statements, references, spans and routing coverage are inspectable in Analysis. Venue scope disagreement is explicitly flagged, not silently extended or hidden.

An intermediate import error in the new effective-count presenter temporarily prevented reload; actual browser console inspection identified the wrong module import, which was corrected and covered by module-link regression. An offline test initially called the existing revision helper with the wrong signature; corrected the test call. A sandbox-only canonical-contract test encountered `EPERM` on a temporary journal rename; the authorized final filesystem/localhost runs pass. Those logs are retained, not represented as provider defects.

No repair changed frozen source, gold, raw response, one-shot identity or earlier verdict. Reprojection of preserved responses is explicitly different from a fresh provider retest. Idle test servers were restarted for code reload; temporary process leases were released only after verifying the process was dead and all requests complete. Permanent provider journals/fences were never removed.

## 7. Production changes

Exact byte-level changed/new file inventory is `verification/batch-b-last-light-20261027/delivery-manifest.json`. Production purpose by file:

| Files | Change |
|---|---|
| `src/documentary-fill-contract.json`, `src/documentary-intelligence.mjs` | One canonical production Fill definition, dynamic bounded target options, automatic documentary routing and strict source/unit/typed decoder |
| `src/core-discovery.mjs` | Opt-in Fill plan/fingerprint/budget reservation, raw revalidation, typed records, deterministic investigation cards, reference quarantine and generic historical-object repair; old two-endpoint fingerprints remain compatible |
| `src/discovery-execution.mjs` | Fill intents/order/receipts/validation/completion/fences using existing durable transport/lock; additional safe cost/timing headers |
| `src/recorded-last-light.mjs` | Integrity-pinned complete recording validation, source/scene/contract checks and real projection acceptance |
| `src/evaluation-mode.mjs`, `server.mjs` | Existing installed Evaluation entry enables Last Light plus preserved U01/U02; isolated originals and journals; exact replay checks; no billable mutation; honest export context/counter semantics |
| `src/production-history.mjs` | New suggestion reviews retain exact historical source context |
| `src/production-lifecycle.mjs` | Additive discovery/total journal counts without rewriting backup originals, journal bytes or derived receipt bodies |
| `src/production-dossier.mjs` | Human-readable effective/legacy counts and explicit documentary investigation semantics; underlying evidence identities retained |
| `public/workspace-desk.mjs` | Fill option submission, review dismissal/draft continuity and Evaluation default production |
| `public/app.js` | Review focus, restored source-unit focus on reload/Back/Forward, new Evaluation default |
| `public/workspace/analysis-view.mjs` | Fill preview/coverage/records and disagreement warning; correct discovery status, no Evaluation billing controls |
| `public/workspace/coordinator-view.mjs` | Source-bound investigations, truthful provenance, accessible review form, retained draft dismissal |
| `public/workspace/presentation.mjs`, `overview-view.mjs`, `export-view.mjs` | Correct effective assessment presentation with legacy accounting preserved |
| `public/workspace/shell.mjs` | Complete-run example controls, stable reset disclosure and honest recovery totals |

Added tests: `tests/documentary-intelligence.test.mjs`, `tests/last-light-evaluation.test.mjs`—**29 additive tests**, existing tests retained. Added research/campaign preparation, live gate, isolated browser/Evaluation servers, read-only inspectors, recording packager and audit scripts. Their commands do not run on ordinary application startup; live scripts require explicit authorization and consumed identities cannot be reused. Earlier prototype definitions are evidence archives, not competing production contracts.

Added `fixtures/audit/LAST_LIGHT_COMPLETE_RECORDED_v1.json` and exact-byte attributes. The recording contains only fictional originals, the actual 23-request journal and the recorded fictional review, not credentials. Its integrity pin is:

`2cc34e798efe694df045418082e29f8b6c3b5b35f600f4167305a9ce5cc30954`

The legacy `makeEvaluationRuntime()` factory defaults remain compatible with historical tests; the installed `server.mjs --evaluate` entry explicitly enables the full Last Light runtime. The new HTTP tests exercise that enabled configuration, not just the old two-example sandbox.

## 8. Final automated verification

| Final command | Actual result |
|---|---|
| `npm test` | **636/636 PASS**, 0 failed/skipped/cancelled; final coordinated log `final-windows-gate-v2.txt` |
| `node --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs` | **109/109 PASS**, 0 failed/skipped/cancelled; `final-frozen-harness.txt` |
| Distinct native + frozen total | **745 PASS**; coverage repeats are not added again |
| Affected-core coverage command (below) | **72/72 PASS**; `final-coverage-v3.txt` |
| Offline accounting/source/evidence ablation | `final-comparison.json`; exact receipts, all source inventory, six current tasks/two investigations, original campaign integrity |

Coverage:

| Module | Lines | Branches | Functions |
|---|---:|---:|---:|
| core-discovery | 100% | 95.65% | 97.53% |
| discovery-execution | 100% | 83.41% | 100% |
| documentary-intelligence | 100% | 81.08% | 100% |
| recorded-last-light | 100% | 70.83% | 100% |
| Combined measured modules | **100%** | **87.36%** | **98.65%** |

```powershell
node --test --experimental-test-coverage `
  --test-coverage-include=src/documentary-intelligence.mjs `
  --test-coverage-include=src/recorded-last-light.mjs `
  --test-coverage-include=src/core-discovery.mjs `
  --test-coverage-include=src/discovery-execution.mjs `
  tests/documentary-intelligence.test.mjs tests/last-light-evaluation.test.mjs `
  tests/core-discovery.test.mjs tests/live-clocked-regressions.test.mjs
```

This measures four modules, not all application branches or provider reliability. New tests cover real saved bodies, unit/source/hash/span mismatch, enums/generated values, explicit issue contradictions, permanent intent/completion accounting, scene binding, source retirement, recording corruption/contract mismatch, actual HTTP Evaluation with forbidden-provider spy, disposable review/History/reset/export, complete lifecycle restoration and effective presentation. Existing legacy/frozen suites remain unchanged. The final coordinated Windows gate was actually executed with `-NoLaunch`: native 636/636 (27,115.5338 ms), frozen 109/109 (10,701.8218 ms), integrity preflights PASS. The final coverage repeat passed 72/72 (12,551.7043 ms).

## 9. Actual in-app browser acceptance

Capability: **Codex in-app browser**, rendered DOM/accessibility inspection, native file choosers, clicks/forms, screenshots and actual downloads. This was not an HTTP-only or simulated-controller PASS. Agent-performed Windows development acceptance remains distinct from the owner's future independent acceptance.

Launchers: `scripts/start-batch-b-browser.mjs --authorize-batch-b-browser` (fictional isolated owner store, server-side credentials, global campaign guard), and `scripts/start-batch-b-evaluation.mjs` (same app/runtime, forbidden provider transport). Owner browser used ports 60453 then 52879 on restart; Evaluation used 53202. These are evidence addresses, not persistent deployment links.

| Rendered interaction | Observed result / evidence |
|---|---|
| Owner unlock; production creation | Real password form and new fictional production; no authentication bypass |
| Four original permits + call sheet | Native choosers; five originals retained, four documents, two scenes, seven units; versions 1→6 |
| Complete preview / authorization | All 14 pairs inspected; exact fingerprint, verifier, cap/reserve, operator and billing affirmation; checkpoint `02-authorized-preview.*` |
| Fresh three-endpoint run | Actual UI command dispatched 23 real requests; original failing projection retained in checkpoint 03 |
| Repaired scene/source loop | Six expected prerequisites and two investigations; S31 handling-only tasks absent from S32; checkpoints 04–08 |
| Source refresh / Back / Forward | LENDER/U002 `[393,688)` restored and visibly focused; actual screenshot `05b-exact-source-after-refresh.png`; transient loading frame retained separately |
| Review/dismiss/reopen/save | Visible focus, draft text retained, version 7 save; not fulfillment; checkpoint 06/07 |
| Work / History | Same saved review, correct CORRESPONDENCE/U001 quotation; checkpoint 08 |
| JSON / Markdown exports | Actual downloaded files 10/11; final clarified recovered Markdown 23; machine/human evidence inspected |
| Backup invalid passphrase / corruption | Actionable authentication-failure guidance, no restored production; checkpoints 13/14 |
| Valid separate recovery / restart | Version-1 recovered copy retained 14 checks, eight suggestions, one review and five originals; checkpoint 16; same selection/evidence restored after owner reauthentication |
| Recovery count repair / duplicate guard | One discovery journal shown; already-present copy not overwritten; checkpoint 22 |
| Credential-free Last Light | Default production loaded without unlock/key; exact real recording/projector, source links and disposable review; checkpoints 17–20 |
| U02 / reset | Existing historical U02 8/8 replay remained available; reset removed only disposable review and restored seed; checkpoint 21; reset-confirmation visibility retested after fix |
| Final documentary inspection | Correct request label/Fill provenance; all five typed records and routing coverage visible; checkpoints 25/27/28; the final reload/expand retest visibly confirmed the advisory scope warning |

All evidence is under `verification/batch-b-last-light-20261027/browser/`. Screenshots were inspected, not merely captured. Tool selector waits sometimes observed an intermediate loading/asynchronous state; work continued to the settled state. A temporary reload failure was investigated and repaired, not declared PASS from a loading screenshot.

Evaluation tests prove zero provider transport calls despite ambient-key test configuration, no private owner workspace access, exact recording checks, safe reset and source/scene/contract mismatch rejection. Instrumented Evaluation shutdowns record zero provider calls, including the final scope-warning retest (`evaluation-runtime-close-22000.json`). Campaign closure is permanently recorded in `campaign-closed.json`. The delivery manifest inventories the final changed files and evidence, verifies 120 historical artifacts and records the credential-leak scan without credential values. No no-key recording is represented as a fresh provider result. Browser source replacement/reversal, every legacy authority form, every responsive viewport and an independent cold evaluator were not retested in this batch; source invalidation/recovery safety has automated coverage and the broader GUI matrix remains Batch C.

## 10. Limits and Batch C boundary

The demonstration is one short developer-authored fictional packet, adapted openly during contract development. It is not a held-out benchmark, real permit trial or proof of source-selection completeness. The general venue Fill target is incomplete and explicitly flagged; one Decide relationship is ambiguous. Documentary routing can miss unfamiliar terminology. The target-choice schema has limited subset expressiveness. Full scope retirement is conservative; stopped/uncertain jobs do not resume. Credits are a local planning reserve, not a provider-enforced per-request price guarantee.

Exact source spans do not prove the phrase was classified correctly. The initial CS-9 false prerequisite is evidence of that risk. Fill improves this particular outcome but does not authenticate issuers, resolve all cross-document precedence, determine missing evidence across the world or establish physical readiness. All original manual source/scope/operational work remains available and unresolved as appropriate.

The BR register remains intact. Narrow fixes in this batch do not close all BR-01–BR-18. In particular legacy authority interpretation defaults/self-link affordances, broader source-focus paths, history-row title collisions, density/readability and responsive premium presentation remain for coordinated Batch C. See the [specific handoff](BATCH_C_HANDOFF_AFTER_REVISED_BATCH_B.md). The owner should not repeat piecemeal GUI tests; one final independent gate follows the entire programme.

Usage: [Last Light guide](LAST_LIGHT_USER_GUIDE.md). **No automatic Batch C, public deployment or submission action is authorized or performed here.**
