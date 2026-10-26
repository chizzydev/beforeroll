# Final implementation contract: Editorial Intelligence Studio

**PRODUCTION_REDESIGN=NOT_STARTED_PENDING_FINAL_SELECTION**

26 October 2026. G is the recommended direction; A is the backup. This contract is ready for a final owner selection. It authorizes no production changes by itself. Reports 06/07 remain the historical A proposal; if G is selected, reports 09/12 become the design and migration specification.

## Accepted foundation

Work in the existing local project. Current HEAD `355cd5a` descends from the accepted `359f476` baseline. The championship changes only its own directory. The earlier independent 501/501 engineering test result and browser closure remain the functional reference. No new engineering-suite result is asserted by the prototype study.

The production application is vanilla ES modules/templates, not React. `public/app.js` is the entry/navigation layer. `public/workspace-desk.mjs` exposes `productionView` and `createWorkspaceController`; `server.mjs` owns guarded operations. The existing workflow fetch uses production identity, scene selection and explicit history/action/task offsets. The review session already calls `review-session/preview` then `review-session/commit` with expected version, as-of and preview hash. Original replacement already has a `document-preview` operation. These are the integration points, not an invitation to create parallel endpoints.

The atomic workflow projection and dossier remain the only production truth. `src/production-dossier.mjs`, consistency, scene workbench, documentary reasoning, authority, source originals, storage and durable execution continue to own their accepted responsibilities. Presentation must consume their derived states rather than recreating authority, coverage or task identity in CSS/UI code.

## Invariants that must survive every migration batch

1. Original bytes, SHA identities, document IDs, Unicode/codepoint quotation ranges, scene rows, source revision and custody records remain exact. A quotation component must render original text, not a rewritten summary.
2. U01/U02 recordings stay frozen and retain their earlier request-contract identity. A design guide is explicitly authored UI text, never a new provider explanation or result. Positive model output never establishes documentary permission.
3. Owner token and provider credentials remain distinct. Keys stay server-side. Preserve localhost/origin/DNS-rebinding protections, storage isolation and evaluation-mode dispatch fences. No analysis on mount/navigation/story playback/recovery.
4. Load a matching atomic workflow snapshot with production/version/dossier identity. Refuse mismatched projections; do not compose an apparently current screen from independent stale card caches.
5. Human decisions remain exact-task/source/scene-bound with required reviewer/rationale, explicit stage/preview/commit and expected-version guards. A condition marked confirmed remains human operational work, not a signed instrument.
6. Source replacement uses the exact previewed candidate and expected version. Selective invalidation and history remain intact; A→B→A cannot resurrect obsolete reviews as current. Counts come from the server, not the prototype's illustrative story.
7. Durable execution journal, in-flight and unknown-billing fences survive optimistic feedback and recovery. Unknown provider outcomes never acquire an automatic retry.
8. Evidence export binds to the reviewed snapshot/as-of identity, includes current/historical coverage and outstanding work honestly, and reports original-custody limits. Encrypted backup/recovery is a separate operation.
9. Durable saved work reopens correctly; unsaved drafts and staged reviews preserve their accepted scope/switch behavior. Older selected prerequisites must reopen their own saved state. Legacy unknown identity remains explicitly unknown.
10. Search, pagination and honest totals keep all scenes/tasks/history reachable. Visible rows are not total coverage. Recovered copies remain separate from their originals.

No production store migration, new authentication, changed Clocked contract or new model pipeline is required to achieve this design. Isolate any genuinely necessary backend change and prove it rather than hiding it inside a visual refactor.

## Controlled replacement architecture

Do not ship the prototype module or its localStorage model. Its saved drafts, revision epochs and recovery specimens exist only to evaluate interactions. They are not production evidence records, a vault, or an alternative controller.

Replace the old design at a coordinated view boundary:

```text
public/design/
  tokens.css                 palette, type, spacing, states
  foundations.css            reset, type, grids, controls, focus, reflow
  components.css             named reusable components; no milestone overrides
public/workspace/
  shell.mjs                  production picker and four destinations
  overview-view.mjs          production opening, list, empty/locked states
  scene-view.mjs             plan, relationship, source and next action
  source-reader.mjs          shared exact quote/full original/provenance
  comparison-view.mjs        common restriction and scene scope groups
  work-view.mjs              queue, prerequisite and schedule detail
  review-view.mjs            scoped draft, stage, preview and commit
  documents-view.mjs         originals, extraction/transcription and roles
  revision-view.mjs          exact candidate and server impact/commit
  history-view.mjs           complete paging/filter/exact selected record
  export-recovery-view.mjs   evidence, backup, separate restore
  presentation.mjs           escaped text and labels over accepted data
```

These are proposed extraction boundaries, not a requirement to split every tiny function. Keep `createWorkspaceController` as behavioral owner while extracting renderers. Preserve existing action attributes/handlers until their replacements are wired and tested. Escape all imported source/provider/user text through an audited helper. No untrusted HTML injection through the new reader.

Create one selected design stylesheet stack and migrate all consumers. Do not append hundreds of G overrides beneath the existing accumulated stylesheet. The exploratory prototype's scoped rules and acceptance refinements are visual references to consolidate, not a production cascade to copy. Remove obsolete shell/noise/card styles only when every route has migrated. Preserve legacy research evidence under a clearly labeled Evidence entry, not a second application shell.

## Route and component mapping

| Existing capability | G destination / entry | Required connection |
|---|---|---|
| List/create/unlock/select production | Overview + production picker | Same workspace/recovered identity and switch guards |
| Import original and verify extraction | Empty overview CTA; Evidence → Sources | Accepted file support, byte custody, preview, named transcription verification |
| Documentary role and scene scope | Source detail; comparison | Existing issuer/reference/claimed-role/scope assertions with human uncertainty |
| Analysis planning and execution | Scene/source context; Work source checks | Exact planned coverage, authorization/budget, execution journal; evaluation mode blocks live dispatch |
| Investigate a scene | Scenes | Same selected scene row/task/source/recording, not a prose-only substitute |
| Compare exception/request | Selected scene → comparison | Exact original clauses; source scope distinct from model/human statements |
| Individual/staged review | Source review + session entry | Existing draft scoping and atomic preview/commit payloads |
| Prerequisites and schedule | Work row → detail | Existing saved status, selected condition identity, dates/timezone/overnight semantics |
| Replace/revise original | Evidence → source → revision | Exact candidate bytes/hash, server impact counts and version refusal |
| Full history | Evidence → History | Search/filter/pages/totals and exact record identity; current/historical links |
| JSON/Markdown evidence | Evidence → Exports | Reviewed snapshot identity, stale refusal, complete scope/custody labels |
| Encrypted backup | Exports → Backup for recovery | Existing crypto/passphrase/original inventory and journal contract |
| Separate recovery | Picker or Exports → Recover | Verify inventory, typed identity, separate copy, source-original limits, no paid retry |

The primary navigation is **Overview / Scenes / Work / Evidence**. Evidence secondary tabs are **Sources / History / Exports & recovery**. A contextual link must restore the relevant selection inside its destination. Do not introduce a second editable issue/condition/review system to suit new cards.

One view-selection object may retain production, recovered space, scene, document, unit/task and historical record IDs. It is not evidence state. URL navigation may contain safe opaque selectors; never put tokens or private source text in URLs. Source edits/reviews remain guarded writes through the controller/server.

## Central scene and authority contract

Desktop: narrow scene register, then two flexible columns. Left contains exact intended activity and the Clocked relationship; right contains exact documentary language and human action. The displayed relationship must be grounded in selected evidence. The U01/U02 prototype's authored vocabulary explanations are examples, not a general inference algorithm. For arbitrary input, use the genuine finding/explanation and exact source references the engine supplies. If there is no structured evidence for a specific vocabulary bridge, use a faithful labeled explanation or omit that device; do not synthesize an unsupported equivalence as fact.

Raw model fields, original identity and history remain one explicit disclosure/navigation away. Historical model findings can disagree with the documentary reading. Preserve that conflict visibly: do not relabel source permission based on a grant score or rewrite frozen output. Claimed document labels such as “SIGNED ADDENDUM” are original text, not authenticated signatures.

Comparison: common restriction first, then two complete scene articles with scene identity, exact scoped language, resulting documentary question and human next step. Desktop aligns comparable rows; mobile stacks complete groups in DOM order. Any excerpt must be labeled and linked to its exact original locator. No new legal clearance state is introduced.

## Responsive, state and interaction requirements

Implement exact foundations from report 09. At 900px and below the permanent scene sidebar becomes a native selection control plus reachable searchable register. At 600px and below use one-column reading order, compact task titles, full-width form actions and grouped comparison. Keep all advanced evidence reachable. Avoid fixed trays that obscure original text. Include “Next human action” on long narrow investigations.

Capture a draft before navigation using the existing scoped draft mechanism. Preserve staged-switch protection. A selected source/passage change invalidates verification. A failed version guard retains uncommitted text and requires renewed source inspection. After success focus the visible result/next action; after failure focus an actionable error summary without clearing fields. Reopening a saved prerequisite must display the exact saved decision, including Blocked.

Empty production explains original → verification → source checks and offers intake. Loading shows no fabricated percentage. Unavailable analysis explains scope and safe navigation. No-model is distinct from “no concern.” Historical is readable with original identity. Stale means no current result for changed inputs and a path to existing reassessment controls. Export and recovery name what is actually included/missing. Error feedback must replace stale success ambiguity.

## Implementation batches after final selection

1. **Checkpoint and contract:** preserve source baseline; owner-selected tokens; frozen-data hashes; existing route/action inventory; baseline screenshots. Use accepted recordings and controlled test transports, zero live provider calls.
2. **Shared frame:** build tokens/foundations, shell, picker, overview and reusable source/status/form/row components. Wire them to the accepted controller. Account for locked/evaluation/recovered/empty cases.
3. **Central journey together:** scenes, exact reader, documentary comparison, scoped review, staged preview/commit and condition follow-through. Test U01 and U02 through actual handlers. Do not stop after the discovery screenshot.
4. **Complete lifecycle:** original intake/transcription/roles, guarded analysis preparation, full work/scheduling, exact revision impact/commit, complete history, evidence exports, encrypted backup and separate recovery. Eliminate prototype-only placeholders from the production build.
5. **Adversarial closure:** run proportional tests and actual browser acceptance below; remove legacy styles/renderers only after every capability is accounted for. Keep one coherent product and one source of truth.

## Required proof before a production redesign can be accepted

Run the existing suite (501-test historical baseline; current test count may grow) and frozen evidence checks. Add meaningful tests for changed navigation/context/guards, not assertions that mirror CSS. Update selectors only when behavior is intentionally preserved. Complete these actual browser journeys at the three championship sizes:

- New fictional production: original import → transcription verification → inspect scope → controlled analysis → exact scene investigation → staged human decision → condition/schedule work → revision preview/commit → selective controlled reassessment → evidence export → reopen → separate encrypted recovery.
- U01 and U02: genuine vocabulary relationship, exact quotes, scoped exception versus unissued request, raw conflict inspectable, no implied authentication or filming clearance.
- A→B→A source change; unaffected retained evidence; obsolete reviews stay historical. Stale review/export refusals and exact candidate/version checks remain intact.
- Unsaved/scoped drafts, staged production-switch guard, older prerequisite selection, multiple history pages and long quotations; no silent coverage caps.
- Unknown billing/in-flight journal, missing original, damaged backup and wrong passphrase. No retry appears as a side effect of recovery or optimistic UI feedback.
- Keyboard-only complete task; meaningful focus/status/error announcements; screen-reader session; 200% zoom/reflow; contrast of actual states/essential boundaries; forced colors; reduced motion; fallback fonts and native controls.

No public deployment, submission, remote push or live validation is part of this contract. Any later live Clocked validation would require a separate explicit budget/instruction.

## One final owner selection

The concrete review artifact is ready now. Use [HYBRID_REVIEW_GUIDE.md](HYBRID_REVIEW_GUIDE.md) for the same evidence and task across G/A/C/B. Give one selection—**SELECT Editorial Intelligence Studio**, **SELECT Cinematic Editorial**, another finalist, or **REVISE** with the specific issue. The recommendation remains a proposal until that selection; production redesign has not started.
