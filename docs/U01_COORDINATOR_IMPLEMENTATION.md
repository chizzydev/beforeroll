# Source-bound U01 coordinator tasks — engineering delivery

27 October 2026 · `CODEX_IMPLEMENTATION_CANDIDATE_NOT_YET_OWNER_ACCEPTED`

## Scope and actual baseline

The application root is `C:\Users\HP\beforeroll-codex-phase1`, Node/ESM package `beforeroll-preflight` 0.29.0. This increment extends that application; it does not replace it or introduce a separate demonstration site. Read all three handoff files before changes, then inspected the production server, atomic workflow/dossier, scene/work/source views, controller, review/session/history/storage paths, live Decide transport, Evaluation Mode, prior Codex reports and frozen research modules.

Existing architecture already supplied source verification, current/historical task identity, durable operator-gated Decide, staged human source reviews, scene/documentary/operational projections, dossier exports, originals custody, encrypted recovery and a disposable recorded Evaluation Mode. These were retained. HEAD remained `bb5559a02944d8cec10c01fd77d46f2ebfacaf22`; no Git mutation, reset, push or deployment was performed. Existing dirty owner changes were preserved. In particular, the pre-existing changes to `public/design/components.css`, `public/workspace/presentation.mjs` and `public/workspace/shell.mjs` were not authored or modified in this increment.

The original native suite passed **523/523** before implementation, zero failures/skips/cancellations (19,175.5327 ms). No baseline was restarted from the old source ZIP.

## Verified evidence import

Read the original U01 Markdown export in Downloads. It actually reports eight original Decide calls, seven findings and thirteen open review questions, including the general-consent model-positive and Scene 48’s unissued request. No old export or recording was rewritten to improve that result.

Located the matched evidence at:

`C:\Users\HP\Downloads\BEFOREROLL_MATCHED_U01_RUNNER_PREP_v1.0\owner-evidence\PV-U01-U002`, `PV-U01-U003`, `PV-U01-U004`.

Independently hashed every file in each original evidence manifest, checked byte lengths, request/source/receipt identity and the existing owner PASS records. Copied the actual request/response/intent/receipt/review/manifest bytes, encoded losslessly, into a **new derivative fixture**, `fixtures/audit/U01_MATCHED_EXTRACT_OWNER_RECORDED_v1.json`. Original response headers were hash-verified at import but not copied into public application assets. The original folders, runner files, reviews and execution fences remain untouched. A final byte comparison and original-manifest verification passed; see `verification/u01-coordinator/preservation.json`.

The compact handoff was used to cross-check the accepted source phrases and receipt identities, not to manufacture response bodies. LFH 4/4 remains an accepted prior research result reported by the handoff; it was not rerun or transformed into new model output here.

| Source | Actual recorded request SHA-256 | Actual recorded response SHA-256 |
|---|---|---|
| U002 | `1861046a663a37d3c40f1a3a21acd6b63766706d2ae2e1a64b44cc31b9131e71` | `83222d1c35c473c2363a29fd546fb5ee5b68c12d1707e47cdc747b16b169a531` |
| U003 | `f617daea1cb0c21327f7342f879f3936031ddf84c5d7b5df4ff77fada280c666` | `ab347d9c5815d9f40836309fca11ae6def53004468e233bd0d84bcf238867503` |
| U004 | `917c95af00bca23d1dff15d589de23be69ba160c0f5cabf5bf4ddf6d1493fb3f` | `43b7fefa475ec30ce8e2808a3e0b9faf7ea763adf7bc62167277243fbf53693d` |

Permit SHA-256: `6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c`.

New imported fixture SHA-256: `9f561cf59dc00cb39ed87ce033adb229d958cf6cc009a4bcf990394e134457a8`. A narrowly scoped `.gitattributes` entry preserves its exact bytes across Windows checkouts. This is checksum/custody verification of owner-recorded evidence, not independent attestation of a provider, document signer or legal authorization.

## Implemented behavior

The real application now derives its coordinator suggestions from validated evidence inside the same atomic production dossier as its existing source checks and review data. The production task composer is not a page containing hardcoded expected output. It consumes literal facts, current source/scene lineage, matching original Decide evidence and the accepted bounded U01 routing.

The adapter accepts exactly the three existing Extract fields: `required_written_documents`, `required_physical_protections`, `required_on_site_personnel`. It checks strict UTF-8, original permit hash, known unit identity/range/hash, original request text, exact request/response bytes and receipts, array/item types, probabilities, codepoint bounds and equality against both the unit and full permit. Unknown categories, wrong offsets/hash, incomplete/malformed responses or unavailable provenance produce explicit incomplete review with zero trusted literal tasks. Empty arrays preserve `NO_LITERAL_REQUIREMENT_FOUND_IN_THIS_FIELD`, not permission or removal of source review. Exact duplicate facts deduplicate by field/span; distinct obligations remain separate. Accepted recorded structures, including nested spans, are immutable after validation.

| Scene | Separate proposed work | Original unit span | Full permit span |
|---|---|---|---|
| S47 | Locate and verify written registrar consent | U002 `[85,110)` | `[170,195)` |
| S47 | Confirm protective boards | U003 `[126,143)` | `[333,350)` |
| S47 | Confirm the on-site registrar remains present throughout the take | U003 `[151,168)` | `[358,375)` |
| S48 | Locate and verify written registrar consent | U002 `[85,110)` | `[170,195)` |

U003 does not produce Scene 48 prerequisites. U004 produces no Extract-derived prerequisite, while its independent Scene 48 documentary warning remains prominent and links directly to the exact U004 source-review task. It asks whether **other** applicable issued authorization exists; it does not claim that no grants exist globally. Source general consent cannot resolve this warning or transfer the S47 exception.

Each suggestion retains original phrase and sentence, unit and permit offsets, scene/document/source hashes, revision/epoch, request/response SHA, `OWNER_RECORDED_CLOCKED_EXTRACT`, `MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED`, incomplete/unassessed support and issuance `UNKNOWN`. Original text is never shortened in stored evidence. Quick links open the existing original-source reader at the correct unit and return to the scene.

Named, reasoned **suggestion reviews** are persisted with optimistic version checks and their own immutable history. They are separate from source-task decisions and operational conditions. Saving one cannot resolve a source question, authenticate a grant, fulfill boards/personnel requirements or create a completed condition. A forged scene/candidate, stale version or retired source is rejected. Staged source reviews must be committed/removed before saving a separate suggestion review, so they are not silently invalidated by that write.

The same suggestions appear in Scenes and Work; overview labels distinguish source reviews from suggestion reviews; History and JSON/Markdown dossier exports retain the new review class. Full original source/Decide/operational work remains accessible. Revision/reversal cannot reactivate these recorded suggestions, and review history remains historical. Nonmatching scenes/sources do not receive automatic literal tasks. Non-U01 work continues through existing explicit source/scene human review and Decide; a generalized literal-evidence intake/automatic selector is not introduced.

Navigation uses URL-fragment reading position only—no source contents, tokens or decisions. In-page action/skip links scroll without overwriting that reading route. Section, production/recovery-space identity, selected scene and source passage can be restored on refresh/Back/Forward. Missing productions raise an explicit error rather than selecting an unrelated one; missing source/scene pointers produce an explanatory current-source fallback. Committed evaluation reviews persist while its server runs; evaluation remains explicitly disposable across reset/server termination. Private authorization remains required before restoring a private reading position.

## Historical 13 versus current 14

The accepted historical comparison counts six deterministic date/location/end unknowns plus seven Clocked findings = **13 open questions**. The present production action queue independently contains **14 HUMAN actions plus two OPERATIONS actions** in initial U01. It includes document provenance, scene-scope mapping and all eight exact-source reviews, including the model-negative pair. That queue was not changed to manufacture a count of thirteen.

The new interface preserves all thirteen historical comparison questions in a labeled disclosure and retains every current production action. Suggestion review leaves both sets intact. Human time/click savings, autonomous selection reliability and real-world clearance are not claimed.

## Exact production files changed or added

All paths are relative to the established repository root. Ten existing production files were extended; five production modules were added.

| File | Change and purpose |
|---|---|
| `src/literal-requirements.mjs` (new) | Pure strict literal-field/source/receipt adapter and deterministic titles |
| `src/coordinator-tasks.mjs` (new) | Anchored recorded bundle validation; source/scene-bound composition, historical comparison and review-only mutation |
| `src/recorded-coordinator-evidence.mjs` (new) | Reads only the public fictional repository recordings, fails closed; no Downloads/runtime credential/provider access |
| `src/production-dossier.mjs` | Adds coordinator projection and separate Markdown evidence/history section without altering original source reviews/counts |
| `src/scene-workbench.mjs` | Adds the scene-filtered coordinator projection from that same dossier |
| `src/production-history.mjs` | Adds suggestion-review history, preserving existing source/model/history rows |
| `server.mjs` | Supplies validated evidence to atomic workflow/dossier; version-checked suggestion-review route; explicit static module allowlist; Evaluation constructor does not read ambient API/operator credentials |
| `public/workspace-desk.mjs` | Consumes atomic coordinator data; exact-source navigation and independent review controls/draft isolation; re-exports navigation through existing app import boundary |
| `public/workspace/coordinator-view.mjs` (new) | Shared Scene/Work review surface, original evidence disclosure, distinct warning, comparison and human review form using existing design classes |
| `public/workspace/navigation.mjs` (new) | Reading-position serialization/restoration and safe unavailable-target handling |
| `public/workspace/scene-view.mjs` | Inserts scene-specific task surface; uses validated U01 comparison defaults and distinct next checks; reuses the existing exact-source work presenter |
| `public/workspace/work-view.mjs` | Inserts the same coordinator surface above the existing unmodified work queue |
| `public/workspace/sources-view.mjs` | Focusable unit targets and return-to-scene action in the existing reader |
| `public/workspace/overview-view.mjs` | Distinguishes counts for existing source reviews and separate suggestion reviews |
| `public/app.js` | History/refresh integration, exact-source focus, and private reading-position restoration after unlock |

The live Decide request builder, questions, transport body, limits and recorded replay history were not changed. No live Extract dispatcher, Fill integration, autonomous decision handler, authority preset or condition-completion automation was added.

Other exact additions/updates:

- `fixtures/audit/U01_MATCHED_EXTRACT_OWNER_RECORDED_v1.json` and `fixtures/audit/.gitattributes`: validated derivative data copy and byte preservation.
- `tests/coordinator-tasks.test.mjs`: 41 additive tests; all previous tests remain unchanged.
- `scripts/verify-coordinator-evidence.mjs`, `scripts/Verify-U01-Coordinator.ps1`: no-network hasher/preflight and the coordinated Windows gate. The gate forces live mode off during tests and restores the prior live flag afterward.
- `README.md`, `README_FIRST_WINDOWS.txt`, `docs/U01_COORDINATOR_USER_GUIDE.md`: current usage, honest evidence labels and one owner walkthrough.
- `docs/README_ENGINEERING_HISTORY_2026-10-27.md`: previous README bytes preserved as history.
- `docs/owner_acceptance/BEFOREROLL_UI_REFINEMENT_REGISTER_v2_2026-10-26.md` and `.gitattributes`: byte-identical historical BR register, not rewritten acceptance.
- This report and `docs/verification/u01-coordinator/`: verification logs, preservation record and rendered checkpoints.

The three authoritative handoff files were read but not edited. Existing experiment directories and evidence were not reset or rewritten. No package/dependency changes were required.

## Automated verification

Final coordinated gate actually executed on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Verify-U01-Coordinator.ps1 -NoLaunch
```

| Final command/check | Pass | Fail | Skipped / cancelled | Actual result |
|---|---:|---:|---:|---|
| `node scripts/verify-coordinator-evidence.mjs` | preflight PASS | 0 | — | Source/receipt hashes, original BR copy and frozen Stage 0 identities verified |
| `npm test` | **564** | **0** | **0 / 0** | Original 523 plus 41 new tests; 22,256.3067 ms |
| `node --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs` | **109** | **0** | **0 / 0** | Network-free unchanged harness regressions; 10,687.7598 ms |
| Total distinct final automated tests | **673** | **0** | **0 / 0** | `owner-gate-automated.txt` |

The first full intermediate native run had 561 passes and one failure among 562 tests: the old simulated-browser test rewrites the established app import boundary and could not load a newly added absolute import from a data URL. Fixed by exporting the new navigation functions through the existing workspace-controller entrypoint, **without changing the existing test**. Its original interaction then passed. The raw failed-run log is retained as `native-tests.initial-failure.txt`. Additional immutable-evidence and in-page-navigation regressions brought the final native count to 564.

The new tests cover actual recorded bytes/offsets and all three response hashes, invalid UTF-8/hash/span/item/category/receipt/provenance, duplicate facts/responses, immutable validated structures, swapped scenes, general-consent grant temptation, S47/S48 isolation, empty U004 extraction, all 13 original questions, unchanged current queue, versioned review/history/readback, source revision/reversal, unchanged-scene retention, dossier JSON/Markdown, actual HTTP Evaluation behavior with provider-call spy zero, controller source navigation/position restoration, both directional comparison defaults, exact U004 review routing, unavailable deep links, forged review history, reset and CSP/static boundaries.

No provider request was made. No historical one-shot experiment or semantic scoring run was re-executed. All test responses not drawn from the accepted immutable recordings are explicitly controlled synthetic cases, not new Clocked evidence.

## Rendered-browser development check

Used the Codex in-app browser against a newly created, disposable Evaluation runtime on `http://127.0.0.1:64168`, with no key and an explicitly forbidden provider transport. This was **actual rendered interaction**, not only HTTP or controller simulation. It is not the owner’s manual Windows acceptance.

Observed interactions:

- Overview → Scenes: three separate S47 task descriptions, exact source sentences, historical labels and pending human verification.
- Boards suggestion → original reader: correct U003, original `[207,399)` unit, return link; browser Back restored S47; Forward and refresh restored the same source reader.
- Scene picker → S48: one consent task, separate unissued U004 warning, no inherited boards/registrar tasks.
- Warning → documentary source-review form: exact S48/U004 `[400,530)`, not the U002 restriction. Returned without committing a source decision.
- Documentary comparison: S48/U004 versus S47/U003, distinct unissued-request and physical/personnel next checks, no authority claim committed.
- Suggestion review: entered **Fictional browser tester** and an explicitly automated fictional-test rationale; checked review-only affirmation; saved to production version 2. UI retained “fulfillment unverified,” no condition completion.
- Action-jump link and refresh: the URL retained its reading route and S48/U004 remained selected.
- Refresh and Work: S48 and the saved suggestion review persisted; the shared Work surface showed all four suggestions and the existing independent source/scope actions.

Screenshots were captured and inspected: `verification/u01-coordinator/scene47.png` (viewport checkpoint) and `scene48.png` (full rendered scene including the fictional review), plus `scene48-review-checkpoint.png` (focused review checkpoint). They contain fictional material only. The runtime’s disposable test state is not owner production data.

The final gate’s `-NoLaunch` branch was tested automatically. Its launch branch deliberately remains part of the owner procedure, invoking the existing Evaluation launcher. Private recovered-copy/expired-session GUI acceptance, independent cold-reader usability and final owner approval remain pending.

## BR-01–BR-18 reconciliation

The register was not initially present in the repository. Located it inside `C:\Users\HP\Downloads\BEFOREROLL_NEW_CHAT_CONTINUATION_PACKET_2026-10-26_v1.zip`, member `BEFOREROLL_UI_REFINEMENT_REGISTER_v2_2026-10-26.md`, read it fully and preserved a byte-identical repository copy. SHA-256: `6b4a0d3f93195dd5cd420c0a519f6820eb15fe429765762f1d67350ed007b1b2`.

The table below records this increment’s narrow engineering disposition, not replacement of the owner’s original acceptance states. **No blanket closure of the 18 items is claimed.**

| ID | Increment disposition / remaining work |
|---|---|
| BR-01 | OPEN: overview identity/hash polish unchanged |
| BR-02 | Candidate correction: Scene next-work rows reuse the existing passage-specific action presenter; broader owner check pending |
| BR-03 | Candidate correction: same shared exact document/unit context and distinct task IDs; no queue deduplication |
| BR-04 | OPEN: legacy source-check summary differentiation not comprehensively redesigned |
| BR-05 | New literal surface uses readable historical labels; legacy repeated “older request contract” copy remains OPEN |
| BR-06 | Partial: focused coordinator work added; full audits remain accessible; residual scroll/mobile density needs owner review |
| BR-07 | OPEN: production-name truncation polish unchanged |
| BR-08 | Implemented candidate: validated U01 S48→U004/S47→U003 defaults in both directions; neutral explicit selection without validated bindings; tested and observed in browser |
| BR-09 | Implemented candidate: source-specific unissued-request versus boards/personnel next checks; owner acceptance pending |
| BR-10 | OPEN HIGH: legacy scope form interpretation preset not changed; new suggestion reviews never submit it |
| BR-11 | New task→reader/review links are exact; legacy broad scope-form landing/focus remains OPEN |
| BR-12 | OPEN UI: legacy one-document relationship affordance remains; no self-amendment was introduced or recorded |
| BR-13 | Implemented exact U004 warning→source-review route, tested and observed; the older generic button still follows its selected source, so broad discoverability acceptance remains pending |
| BR-14 | New consent tasks explicitly name supporting evidence; old `Needs original source` decision wording remains OPEN |
| BR-15 | Implemented section/scene/source URL restoration; actual in-app Back/Forward/refresh passed; owner’s Windows gate pending |
| BR-16 | OPEN: original-download filename label polish unchanged |
| BR-17 | Candidate production/recovery-space reading-position restoration with authorization and unavailable-target handling; private recovered-copy/expired-session GUI matrix still pending |
| BR-18 | OPEN optional recovery-version explanation; recovery IDs/versions were not rewritten |

## Remaining limits and owner gate

This increment uses a researcher-selected, exposed fictional source packet with fixed accepted U01 applicability. It does not demonstrate automatic source discovery, complete obligation enumeration, independent generalization or saved coordinator time. A literal phrase and high confidence do not establish issued authority, authenticity, applicability or fulfillment. Non-U01 literal-evidence intake is not generalized into an untested dispatcher; existing explicit source/scene human workflows remain available.

Suggestion review is intentionally acknowledgment of investigation, not operational confirmation. Committed reviews are retained; unsaved drafts are not promised to survive server termination. Evaluation resets/termination are deliberately disposable. Exported source/model/review provenance remains distinct. Existing high-priority scope-form BR items are disclosed above, not hidden by the new cards.

Run the **single coordinated Windows command** and eight-step owner walkthrough in [U01_COORDINATOR_USER_GUIDE.md](U01_COORDINATOR_USER_GUIDE.md). It runs the hasher/tests and launches Evaluation Mode. No further development-time manual tests are requested here.

**Final status: `CODEX_IMPLEMENTATION_CANDIDATE_NOT_YET_OWNER_ACCEPTED`.** Automated gate passes; owner GUI acceptance and deployment authorization have not been granted by this implementation.
