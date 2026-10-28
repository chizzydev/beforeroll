# BeforeRoll documentation index

## Current product and release guidance

- [Product, workflow, setup and sponsor contribution](../README.md).
- [Last Light interactive user guide](LAST_LIGHT_USER_GUIDE.md).
- [Completed demonstration](submission/DEMONSTRATION.md).
- [Three-endpoint technical explanation](submission/TECHNICAL_WRITEUP.md).
- [Public and protected verification scopes](submission/RELEASE_VERIFICATION.md).
- [Final public-release receipt](submission/FINAL_PUBLIC_RELEASE.md).
- [Security and distribution](submission/SECURITY_AND_DISTRIBUTION.md).
- [Development and credits](submission/DEVELOPMENT_AND_CREDITS.md) and [original/public history mapping](submission/PUBLIC_HISTORY_MAP.json).
- [Current entry checklist](FINAL_BEFOREROLL_RELEASE_AND_SUBMISSION_CHECKLIST.md) and [entry copy](submission/SUBMISSION_COPY.md). Publication/video/Windows acceptance are complete; official submission remains separate.

## Historical engineering records — read in date order

The files below describe their **then-current build**, not today's pending work. In particular, old statements that live integration, Fill, public GitHub, video or independent owner acceptance are pending are historical. Current instructions above and the final accepted evidence govern. Dated reports are retained without rewriting past events or hiding failures. Malformed relative links in the embedded M3-S4 README history are corrected; its historical claims remain unchanged.

| Record | Why it remains |
|---|---|
| [Batch A narrative research](BEFOREROLL_DEMO_NARRATIVE_CHAMPIONSHIP_v1.0.md) | Domain/sponsor sources and reasoned scenario selection; its earlier capability limits are historical |
| [U01 coordinator increment](U01_COORDINATOR_IMPLEMENTATION.md) | Evolution from recorded source-specific tasks to reusable discovery |
| [Core implementation](CLOCKED_CORE_DISCOVERY_IMPLEMENTATION.md), [architecture](CLOCKED_CORE_DISCOVERY_ARCHITECTURE.md), [live campaign](CLOCKED_CORE_LIVE_VALIDATION_2026-10-27.md) | Generalized intake/discovery and preserved 57-request development evidence |
| [Batch B report](BATCH_B_THREE_ENDPOINT_HERO_REPORT.md) | Exact three-endpoint contract, failed attempts, 39-request campaign and 23-request accepted hero |
| [Batch C report](BATCH_C_PRODUCT_EXPERIENCE_CHAMPIONSHIP_REPORT.md), [browser matrix](BATCH_C_BROWSER_ACCEPTANCE.md), [design decisions](BATCH_C_EXPERIENCE_DESIGN_DECISIONS.md) | Coordinated BR-01–BR-18 corrections and actual rendered acceptance; later owner acceptance is separately confirmed |
| [Original BR register](owner_acceptance/BEFOREROLL_UI_REFINEMENT_REGISTER_v2_2026-10-26.md) | Exact original issue evidence pinned by the verifier, not a new owner-testing request |
| [Batch D report](BATCH_D_SUBMISSION_CHAMPIONSHIP_REPORT.md) | Original RC1 packaging, public/protected scope split, security and release failures/repairs |
| [Batch C handoff](BATCH_C_HANDOFF_AFTER_REVISED_BATCH_B.md), [Batch D handoff](BATCH_D_SUBMISSION_DEPLOYMENT_HANDOFF.md) | Historical links between accepted increments; not current instructions to redo completed work |

Other `M0`, `M1`, `M2`, `M3*`, `ACTUAL_M1*`, `JUDGE_TOUR*`, `RESEARCH_*`, `U01_COORDINATOR_USER_GUIDE.md` and `README_ENGINEERING_HISTORY*` files are **historical milestone evidence**, including limitations and earlier UI captures. Their old routes, planned stacks, counts and acceptance requests are not the final setup contract. Historical SHA manifests describe the snapshots they accompanied, not the current release inventory.

## Evidence dependency and cleanup policy

`fixtures/audit/`, `experiments/p0b/` and necessary `verification/` campaign artifacts remain because tests, exact replay and scientific reproducibility depend on their original sources, responses, gold and failed attempts. No frozen provider answer, verdict, request fence, test expectation or application behavior changes in this cleanup. The RC1 inventory is preserved unchanged at [verification/releases/RC1_RELEASE_MANIFEST.json](../verification/releases/RC1_RELEASE_MANIFEST.json); the root manifest describes the new tree.

The internal U01 handoff directory is removed from the current distribution. Its only public file, accepted evidence JSON, is retained **byte-identically** at [fixtures/audit/U01_ACCEPTED_EVIDENCE.json](../fixtures/audit/U01_ACCEPTED_EVIDENCE.json); the offline verifier points there with unchanged assertions. It is data, not an internal implementation instruction package.

Five redundant internal files were removed from the current tree: an obsolete M0–M2 next-increment ledger, three early duplicate console receipts and a superseded browser harness. Their exact bytes remain in the protected local release audit and normal published history; none is a runtime/test dependency. Original versions:

- [docs/NEXT_INCREMENT_CONTRACT.md](https://github.com/chizzydev/beforeroll/blob/790dd27b2a5e74c5f05f10478c6ab9e1017d11de/docs/NEXT_INCREMENT_CONTRACT.md)
- [docs/M0_OFFLINE_TEST_RECEIPT.txt](https://github.com/chizzydev/beforeroll/blob/790dd27b2a5e74c5f05f10478c6ab9e1017d11de/docs/M0_OFFLINE_TEST_RECEIPT.txt)
- [docs/M3S2_OFFLINE_NODE_TEST_RECEIPT.txt](https://github.com/chizzydev/beforeroll/blob/790dd27b2a5e74c5f05f10478c6ab9e1017d11de/docs/M3S2_OFFLINE_NODE_TEST_RECEIPT.txt)
- [docs/M3S8_RELEASE_RECEIPT.txt](https://github.com/chizzydev/beforeroll/blob/790dd27b2a5e74c5f05f10478c6ab9e1017d11de/docs/M3S8_RELEASE_RECEIPT.txt)
- [docs/m3s2_browser_harness.py](https://github.com/chizzydev/beforeroll/blob/790dd27b2a5e74c5f05f10478c6ab9e1017d11de/docs/m3s2_browser_harness.py)

Current demonstration instructions replace obsolete recording plans; historical Batch D media failures remain explicitly historical. Owner-acceptance records that establish actual observations are retained, not mistaken for unfinished tasks. Private preservation archives, backups and disposable stores remain excluded by owner instruction. No published history is rewritten.
