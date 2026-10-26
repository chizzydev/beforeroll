# Functional preservation

The redesign changes presentation and navigation over the accepted functional engine. It does not replace the application or introduce independently editable evidence.

## Evidence integrity

`verify-preservation.mjs` compares the working championship with checkpoint `677e02d` byte for byte and verifies all tracked fixtures against their checkpoint blobs (allowing existing Git CRLF normalization for text fixtures). `evidence/preservation-manifest.json` records SHA-256 for every compared file: **393 championship files and 11 fixture files**, with no mismatch. The frozen source preflight independently reports U01 SHA-256 `6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c` and U02 `8efad29fe4f45d6212fd526f241568ada43d62db930800f52603eb1841dc1ddb`; both retain two scenes, four clauses per scene and their original gold assertions. Preflight passed with zero Clocked calls. Original recordings were neither rescored nor overwritten.

## Invariant checks

| Invariant | Preservation and evidence |
|---|---|
| Source bytes, hashes, locators and scene/task identity | Existing intake, vault and task functions remain authoritative. Exact codepoint quotations are printed from server packets. Long excerpt regression includes astral Unicode and exact partial/full ranges |
| Production version and atomic projections | Existing atomic workflow packet and consistency certification retained. Navigation validates packet identity; comparison resolves actual server tasks and checks versions |
| Human authority | Reviewer and rationale remain required. Real staging, exact-source verification and atomic commit remain. Browser tested disabled commitment before verification and saved reviews after commitment |
| Source replacement and reversal protection | Existing preview/exact-file commit guards retained. Browser Bay Lantern v18→19 retained four checks, retired four and added four; source-reversal and conflict assertions remain in the complete suite |
| Selective reanalysis | Engine unchanged. UI exposes four retained and four unevaluated checks after replacement, with original journals historical. No new provider call was needed to test it |
| Current versus historical evidence | Current review survives unchanged source; changed review becomes historical. Read-only historical context derives only from the matching task or immutable journal. Missing legacy context is explicit, never substituted from current wording |
| Durable execution and unknown billing | Execution modules unchanged. Controlled interruption shows uncertain outcome and fenced analysis with no dispatch/retry controls |
| Authentication and workspace isolation | Owner guard, cookies, tokens and evaluation store boundaries unchanged. Private browser began locked; generated test token was used only on localhost. Evaluation needs no credentials |
| Large-production coverage | Existing server pagination preserved. Browser reached scene 275 of 75, findings 41–45 of 45 and work 31–60 of 6,900; additional regression resolves a comparison task beyond the first page |
| Original custody, exports and recovery | Browser exports bound to inspected version. Three originals retained for new production; backup verified, wrong passphrase rejected, mismatched typed ID rejected, separate restore completed |
| Recovery identity | Independent deep comparison of browser-downloaded original/restored packs: workspace, journal list, original inventory and dossier counts exactly equal. Original wrapper v9, separate restored wrapper v1. This new production had zero model journals; journal-rich and interrupted recovery remain covered by existing automated tests |

## Tests and interpretation

The baseline was independently rerun: **501/501** passed. A sandbox-only attempt encountered Windows hard-link/listen permission failures; the same suite ran successfully with local execution permissions. These environmental failures are retained in `baseline-tests.txt`, with the verified result in `baseline-tests-verified.txt`.

The original 501 tests remain. Existing UI capability assertions were adapted to task-oriented destinations using `tests/helpers/ui-views.mjs`; they previously assumed every form existed in one monolithic hidden panel. Human labels changed, so assertions use readable labels while still checking underlying state. Scientific assertions and frozen data were not changed. The helper only renders reachable views in tests; it is not runtime application state.

New `editorial-studio.test.mjs` regressions exercise read-only navigation, unfamiliar source content, the real HTTP stage/verify/commit transaction, staged-work guards, progressive intake, draft scoping, static asset/CSP boundaries, origin labels, uncertain execution fencing, historical context immutability, Unicode quotation ranges, disclosure persistence, cross-document/page comparison and controlled-result wording. Ordinary source failures also must not display unrelated backup guidance.

Final full-suite output is retained in `evidence/final-tests.txt`: **516/516 passed**, with zero failures/skips. Final focused redesign regressions also pass after the source/recovery guidance refinement (`editorial-final-tests.txt`). Token text pairs exceed 4.5:1 and essential control/focus pairs exceed 3:1; calculations are in `contrast-check.json`, not a formal accessibility certification. Earlier failed integration runs are retained to show corrections, including readable-label assertion migrations. No test success is substituted for browser acceptance.

## Backend changes

Only the static allowlist and read-only history context were changed server-side. Request payloads, provider transport, billing safeguards, storage mutation, source verification, encrypted backup and authentication contracts are unchanged. The UI filters generic recovery guidance away from ordinary source import failures; actual recovery retains actionable backup guidance.

No `.env` was read for acceptance. The acceptance harness runs the actual server with disabled provider transport and isolated generated stores. Its two controlled completions and one deliberately interrupted fixture are labeled test data, carry zero credits and make no network request. Genuine Bay Lantern records were read from a copy of the prior fictional engineering store. No paid Clocked request occurred during this redesign.
