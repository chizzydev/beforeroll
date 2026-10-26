# Controlled implementation contract

**Status: proposal only. PRODUCTION_REDESIGN=NOT_STARTED_PENDING_SELECTION.** The owner must select the direction after reviewing working A/B/C prototypes. This document defines the work that can follow; it is not a request for repeated implementation permissions.

## Starting point and non-negotiable invariants

Actual local HEAD `355cd5a`, with accepted engine baseline `359f476`. Independent baseline test run: 501/501. Current application is vanilla ES modules and server-rendered/template-string client views, not React. `public/app.js` owns application entry/navigation and legacy research surfaces; `public/workspace-desk.mjs` exports `productionView` and `createWorkspaceController`; `server.mjs` provides the guarded HTTP workflow. A new frontend framework is not necessary to implement the winner coherently.

Preserve:

1. Exact original bytes, source hashes, Unicode/codepoint citation ranges, scene rows, stable document IDs, revision/epoch identity and custody inventory.
2. Frozen U01/U02 source/recorded evidence and preregistered assertions. Copies for presentation remain projections, not mutated scientific records. No re-scoring or relabeling old results as current-contract live output.
3. Owner access token distinct from provider key; localhost/origin/DNS-rebinding boundaries; server-side credentials; evaluation store isolated from private data and live execution.
4. Atomic workflow snapshot with matching production/version/dossier identity. No independently cached card counts or local mutable truth for queue/workbench/history.
5. Human review attached to the exact source task, explicit staging/preview/commit, required rationale and version/as-of checks. Operational confirmation never creates documentary authority.
6. Exact source replacement preview, exact candidate commit, selective invalidation, historical retention and A→B→A non-resurrection.
7. Durable execution journal; in-flight/unknown billing fences; no automatic retry or hidden paid request on mount, navigation, story playback or recovery.
8. Complete current/historical exports bound to the reviewed snapshot; explicit outstanding work and original-custody limits; encrypted separate recovery and original preservation.
9. Saved-state persistence, memory-only unsaved drafts, draft selection scoping, staged-session switch protection, history pagination and legacy-unknown identity labels.
10. Bounded task planning and honest coverage, including large productions; no UI cap silently turning partial pages into complete coverage.

## Architecture verified from source

`GET /api/workspaces/:id/workflow` builds an atomic workspace projection: original inventory, overview, execution state, action queue, scene workbench, journey, operations, dossier summary, consistency and history. The server checks that source state has not changed before returning it. The controller verifies matching identities before accepting it.

`src/production-dossier.mjs` and `production-consistency.mjs` are the evidence/consistency foundations; `production-journey.mjs` is a read-only derived lifecycle, not editable stage truth. `scene-workbench.mjs`, `production-actions.mjs`, `documentary-reasoning.mjs` and `document-authority.mjs` derive views of that same production. `durable-execution.mjs`, `source-originals.mjs`, workspace storage and recovery modules own durable state.

Verified guarded routes include `review-session/preview`, `review-session/commit`, `document-preview`, `impact`, execution/export, workflow/export evidence and lifecycle backup/recovery actions. Exact route names and payloads must be taken from the current controller/server when implementing; do not invent a second REST API just to fit components.

## Replacement strategy

Replace the view system as one coordinated boundary. Do **not** append a new stylesheet under the accumulated old stylesheet and fight it with specificity. Do **not** copy the prototype's localStorage review simulator into production.

Proposed structure under `public/`:

```text
design/
  tokens.css          exact selected palette/type/space
  foundations.css     reset, type, focus, base controls, responsive grid
  components.css      named reusable components, not milestone overrides
workspace/
  shell.mjs           production identity + four navigation destinations
  brief-view.mjs      opening/empty/production brief
  scene-view.mjs      plan + Clocked + source + human action
  source-view.mjs     register, transcription, original reader, comparison
  review-view.mjs     individual form + staged transaction preview
  work-view.mjs       queue, schedules and prerequisite detail
  history-view.mjs    complete paged history and selected record
  change-view.mjs     exact source impact and commit
  export-view.mjs     current export and separate backup/recovery
  presentation.mjs    pure labels/view models, no authority mutation
```

Keep `createWorkspaceController` as the behavioral owner initially. Extract view functions from its large template rather than simultaneously replacing persistence and visuals. Preserve action IDs/data attributes until handler migration is complete. Introduce named presentation helpers for repeated source identity, state label and quotation rendering. Escape user/source text through one audited helper; do not inject HTML from source documents or provider explanation.

Update `public/index.html` to load the selected foundations/components as the only main application design system once all routes are covered. Move legacy research content into an explicitly separate, discoverable Research destination under Documents & history; preserve its zero-relabeling semantics. Remove obsolete `.noise`, old shell/card styles and accumulated overrides after their consumers have migrated. The old interface is a temporary development fallback, not a second production product the user must choose between.

## View and lifecycle mapping

| Existing operation | New destination / contextual entry | Must remain intact |
|---|---|---|
| Production list/create/unlock | Production picker / blank brief | Owner boundary, recovered-space identity, unsaved/staged switch protection |
| Import and verify | Documents & history → Sources; blank brief CTA | Supported input constraints; exact byte custody; explicit transcription and original comparison |
| Map authority | Selected document details + scene comparison | Claimed roles/issuer/reference, source→scene assertions, no signature authentication |
| Run source checks | Scene/production analysis preparation | Scope/task preview, authorization and budget controls, journal outcome/credits, no evaluation dispatch |
| Investigate findings | Scenes → selected scene | Exact row/quote/recording provenance; current task; raw fields disclosed |
| Human individual and staged review | Selected source review + session tray | Exact task identity and reviewer/rationale; explicit preview and atomic commit |
| Resolve prerequisites | Work → selected condition; scene follow-up links | Saved status including older selected condition, dates/timezone/overnight, source bindings |
| Reconcile revisions | Document → Replace original → impact preview | Expected version, exact file/hash/preview, retained/retired/added counts, reversal history |
| Complete history | Documents & history → History | Filters/search/totals/pages, exact selection and open-current links |
| Evidence JSON/Markdown | Production → Export evidence | Reviewed snapshot version/dossier/as-of, stale refusal, current + historical records |
| Encrypted lifecycle backup | Export → Backup for recovery | Distinct from ordinary report; passphrase handling, original inventory and journal integrity |
| Separate restore / diagnostics | Production picker → Recover | Verify before restore, typed identity, separate copy, missing-custody and lock guidance |

Names and arrangement change. No server enum is renamed merely to remove uppercase from the UI. Use a presentation map, retaining raw codes in advanced details/export.

## State and interaction rules

One route/view selection object may contain destination, production ID, recovery space, scene ID, document ID, unit/task ID and history selection. This is view state only. Selecting a scene does not persist a review or run analysis. Query/hash navigation must restore the same selection when safe; private sources must never be put into URL text. Do not expose tokens or full documents through shareable deep links.

Before replacing a rendered view, capture drafts through the existing scoped mechanism. Keys must still include production/recovered space/version/scene/task/prerequisite. Do not “helpfully” prefill another task's saved status. On stale version show the conflict, retain text as an uncommitted draft and require fresh source inspection. Preserve the current behavior that refuses production switching with staged reviews. After successful save focus its visible result/next action, not page top. Native anchors and disclosure must remain keyboard operable.

For long sources: the reader can expand full text or open original bytes; the compact scene view may show a labeled excerpt with exact locator. Never use a rephrased summary in the quote component. Do not infer document authority from model grant scores. Issued wording and human documentary assertions have separate labels. History uses read-only styling without dimming it below contrast requirements.

## Functional changes genuinely required

- A coordinated view/navigation restructure and context-preserving selection across the four destinations.
- A presentation-label layer for raw states and actions; raw codes remain available.
- Focus management and native narrow action jumps; reflow without horizontal document overflow.
- Reusable feedback/empty/error components for the existing server states.
- A consistent document reader shared by scene review, history and revision preview, retaining exact source and version.

No new model pipeline, changed request contract, storage schema migration, billing logic, grant inference, OCR engine, authentication mechanism, cloud collaboration or theme service is required by this design. If implementation reveals a backend contract gap, isolate and justify that change rather than hiding it in a visual refactor.

## Execution batches after selection

1. **Lock the contract.** Owner selects A/B/C; preserve a local source checkpoint, tokens, example fixtures and screenshot baseline. Define view selectors and acceptance matrix. Do not touch frozen evidence.
2. **Build the whole frame.** Replace shell, production picker, foundations and shared components. Provide truthful blank/locked/evaluation states. Keep controller behavior and guards.
3. **Deliver the central journey together.** Scene investigation, source reader, exception comparison, exact human review, session preview/commit and work follow-through in one integrated batch. Test both S47/S48 and U02 rather than polishing one screenshot.
4. **Complete the lifecycle.** Import/transcription, role/scope, authorized analysis preparation, prerequisites/schedule, guarded revisions, history, exports, backup and separate recovery. No “advanced” placeholder buttons in the production result.
5. **Adversarial browser closure.** Exercise the whole accepted journey at desktop/tablet/narrow; source reversals, draft context, stale export, missing custody and unknown billing. Remove old view/style code only after each consumer is accounted for.

## Verification proportional to the redesign

Run the existing 501-test suite and frozen read-only audits; retain behavior regressions, updating only selector assertions that reflect the intended new view. New tests should verify changed navigation/context and actual invariants, not mirror CSS declarations. Browser tests must exercise actual forms/handlers and resulting stored state. No passing screenshot-only suite substitutes for source-bound review correctness.

Required acceptance evidence:

- First opening shows a specific film-production intelligence example quickly, with honest recorded/evaluation provenance.
- Same exact scene/quotation/model record survives navigation to review, work and history.
- U01: addendum only for S47; unsigned request never grants S48. U02: approved wall placement versus unissued across-passage relocation remains understandable.
- New fictional production: import supported originals, verify transcription, inspect coverage, review sources, record human work, revise, selective reanalysis using controlled transport, export, reopen and separate recovery.
- A→B→A: historical review never resurrects; unaffected evidence remains; exact preview/stale guards hold.
- Staged review/draft protection, older prerequisite selection, all history pages and long source identities work at 390px and 200% zoom.
- Unknown-billing attempts never acquire a retry control through an optimistic UI state.
- Keyboard-only flow, focus return, reduced motion, status announcements, error retention, contrast and screen-reader checks.
- Security boundaries and no new network/provider side effects from opening or browsing the UI.

Zero new live Clocked requests are authorized for this design exploration. Future production implementation can prove UI behavior with controlled test transports and existing recordings; a new live validation budget would require a separate explicit instruction.

## One owner GUI selection plan

Allow 15–20 minutes once. Open the prototype launcher described in [README](README.md). The gray toolbar selects concepts and comparable states; the product navigation operates inside each concept. Prototype-only human notes persist in your browser and never reach BeforeRoll's production store.

1. Compare A, C and B on **First impression**, then **Discovery**, at the same window size. State which scene activity and permit condition you understand first.
2. In each, compare the addendum/request, open Scene 48 and explain why an unsigned request does not establish its exception. Record a fictional source review, stage, verify and apply it. Reopen History.
3. Inspect paragraph 4, expand model/source identity, return to Work and filter to Scene 48. Check that advanced evidence is findable without competing with the main scene concern.
4. Narrow the browser and try **Next human action**. Read the quotation and form without sideways page scrolling. Judge readability and navigation, not how much fits into one screenshot.
5. Give one decision: **SELECT Cinematic Editorial**, **SELECT Documentary Evidence Lens**, **SELECT Precision Intelligence Studio**, or **REVISE** with the specific failing interaction/visual concern. Selection authorizes planning against that direction only as you instruct; no production redesign has started.

This is the single bounded owner design-selection gate. Engineering research and prototype validation have already been performed; the owner is choosing the product direction, not being asked to run the agent's tests.
