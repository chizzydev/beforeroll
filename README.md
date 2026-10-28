# BeforeRoll

**Know what the shot depends on.**

BeforeRoll helps location managers and production coordinators turn filming paperwork into **scene-specific documentary review work**. Clocked connects planned activities to original language, extracts literal prerequisites and organizes documentary investigations. People verify permission and readiness.

**The Last Light:** the crew can film inside an observatory archive. The next shot asks an actor to unfold a borrowed atlas. Room access alone does not establish handling authority.

![The real Last Light brief](docs/submission/images/overview.png)

## Try it: no account, key or paid requests

Install **Node.js 20+**, then run from the extracted repository root:

```sh
node scripts/release/evaluate.mjs
```

Open **http://127.0.0.1:3000**. If occupied, use `node scripts/release/evaluate.mjs --port=3001`. Windows users can also double-click `Start-BeforeRoll-Evaluation.cmd`. Stop with Ctrl+C or type `stop` in the Node launcher.

No dependencies or build step: Node built-ins and browser-native modules. Release validation uses Node 24.13.0; 20 is the declared minimum, not a separately tested binary.

This is the **real application**, replaying previously recorded genuine Clocked responses on fictional originals. No new provider calls. Each local server has a separate temporary sandbox; two tabs on one server share state/reset. Never upload private material or publish this local server through a tunnel/proxy.

No public app/video URL has been published. The [demonstration package](docs/submission/DEMONSTRATION.md) identifies available media and publication steps. Publication and submission require owner approval.

## A judge's first journey

1. **Overview → Investigate S31.** Five prerequisites and one documentary investigation: written lender consent, book cradle, padded tray, conservator and shared venue duty officer work.
2. **Read original & provenance.** Inspect exact imported language and offsets. Refresh/Back/Forward retains context.
3. **Switch to S32.** The case-only interview retains venue personnel but does **not** inherit handling tasks. The wider extension remains an **unissued request**.
4. Inspect **Consent Schedule CS-9**: an instrument to locate and verify, not an invented imposed prerequisite. A claimed variation is not authenticated authority.
5. **Record suggestion review.** Enter a fictional reviewer/rationale and explicitly affirm review-only status. Saving records investigation progress, not fulfillment or filming permission.
6. Visit **Work → Evidence → History → Exports & recovery**. Download the actual JSON pack and Markdown handover. Explore U01/U02 historical examples, then reset.

The visible Fill warning is intentional: its general venue record named only S31. Independent Decide/Extract evidence supports **both** venue tasks; both remain. Targets are not exhaustive authority.

![Actual S31 task groups](docs/submission/images/scene31.png)

## Why Clocked matters

A shot says “unfold the chart”; a lender regulates “direct manipulation.” Shared room names alone do not establish which scene needs consent, protection or supervision.

| Endpoint | Consequential contribution | BeforeRoll validates and routes |
|---|---|---|
| **Decide** | Typed scene/passage relevance and documentary-claim judgments with uncertainty | Complete selected inventory and relevance routing; probability never authenticates authority |
| **Extract** | Literal written-document, physical-protection and on-site-personnel lists | Original quotations, hashes and Unicode codepoint `[start,end)` spans; scene-specific task cards |
| **Fill** | Claimed documentary role, verbatim statement/reference/scope and investigation target | Exact source validation; requests/history/claims stay distinct; documentary investigations and disagreement disclosure |

The owner workflow selects whole verified documents/scenes, not individual clauses or custom extraction questions. Exact previews, explicit local authorization and durable intent fence billable execution; uncertain outcomes halt without blind retries. Evaluation reprojects the accepted recording and cannot start new discovery. [Technical explanation](docs/submission/TECHNICAL_WRITEUP.md).

### Same-packet comparison

| Configuration | Observed result |
|---|---|
| AI off | Originals, complete inventory, deterministic warnings, comparison and manual reviews remain; coordinator investigates relationships/requirements manually |
| Decide + Extract | Six expected scene-bound prerequisites **plus one unsupported prerequisite classification**, cited CS-9 |
| Plus Fill | Six correct prerequisites **plus two documentary investigations**; CS-9 remains investigation; one advisory venue scope disagreement remains |

Two-endpoint results are a **read-only ablation of the same genuine receipts**, not a second paid run. Hero: **23 requests / 62 reported credits** (14 Decide, 4 Extract, 5 Fill), 15,467.7490 ms summed transport latency. Added Fill: 5 requests / 32 credits / 3,554.2958 ms. Credits are not currency; latency is not measured coordinator time. The adaptive Batch B campaign used 39/150 and retains failed attempts.

## Trust and limitations

No automatic filming clearance, signature authentication, issued authority or fulfilled physical conditions. No universal permit reliability, measured time saving, incident prevention or real-production adoption claim. Exact quotes prove correspondence, not correct classification. Last Light is an exposed developer-authored fictional packet, not a held-out benchmark.

Inventory covers represented imported text, not all applicable instruments in the world. Heuristics and limited Fill target-subset expressiveness remain constraints. Missing suggestions are not permission. Genuine recordings, controlled fake test transports and disposable human reviews are distinct. U01/U02 retain their earlier contracts/questions.

## Reproduce and verify

No npm installation is needed. The release check nevertheless exercises `npm install --ignore-scripts --package-lock=false --no-audit --no-fund` offline. Evaluation needs no `.env` or owner store.

```sh
node scripts/verify-last-light-recording.mjs
node --test tests/release-boundary.test.mjs
node --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs
```

`npm test` runs the complete native suite: accepted Batch C 657 plus additive release tests. The public application procedure runs 661 native cases without excluded archives. The complete protected workspace runs 662, including the original archive integrity assertion moved intact into its own local-only test file. Both scopes have zero failures or skips. Encrypted backups and disposable stores remain outside the public package by owner instruction. [Exact engineering versus release verification](docs/submission/RELEASE_VERIFICATION.md). Never rerun frozen paid experiments or remove consumed fences.

## Stack, history and credits

Node ESM HTTP, native browser modules, local JSON evidence/original-byte vault, scrypt/AES-256-GCM private backups, strict CSP and direct-loopback same-origin fences. No third-party runtime package, CDN, UI framework or build service. Private owner mode remains authenticated and separate.

`src/core-discovery.mjs` plans/projects; `discovery-execution.mjs` journals; `literal-requirements.mjs` validates Extract; `documentary-intelligence.mjs` validates Fill; `recorded-last-light.mjs` validates replay. Scenes, Work, History and exports share projections. [Architecture](docs/CLOCKED_CORE_DISCOVERY_ARCHITECTURE.md) · [User guide](docs/LAST_LIGHT_USER_GUIDE.md).

Git ancestry begins with an assembled v0.29.0 snapshot on 25 October 2026, then cohesion/design work on 25–26 October. Discovery, Last Light and Batch C were auditable 27 October working changes before release packaging. A transparent public-history derivative excludes 13 third-party/other-application research screenshots, preserving source changes, author/date/message and failure evidence; original commit IDs map to public IDs in the development record. Full original local history remains untouched. No fabricated/backdated sequence. [Development and credits](docs/submission/DEVELOPMENT_AND_CREDITS.md).

AI-assisted development was used. Showcase originals/scenes/reviews are fictional. Clocked by Rezolve.ai provides genuine recorded outputs, not endorsement. CSS/screenshots are original; system font files are not redistributed. No third-party artwork or music. [Rights](NOTICE.md): existing **UNLICENSED/all rights reserved** status remains pending owner licensing choice; public review is not an open-source license.

The [official entry](https://clocked.rezolve.ai/challenge) follows the [published rules](https://clocked.rezolve.ai/build-challenge/rules). This local candidate is not publicly deployed, submitted or independently owner-accepted.
