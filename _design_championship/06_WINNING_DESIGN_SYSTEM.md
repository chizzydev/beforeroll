# Cinematic Editorial — proposed design contract

Implementation-ready proposal, **pending owner selection**. The runnable prototype is the visual reference for the five core states; this contract extends it to all accepted production capabilities. Prototype simplifications are not permission to simplify data integrity.

## Product grammar

BeforeRoll is a production reading desk: the crew's intended activity, a Clocked relationship, original documentary language and human follow-through. The key composition is a two-column scene investigation, not a dashboard or an AI chat. One selected production and one selected scene establish context. One original-source reader owns quotation selection. One work register owns outstanding work. History is a view of the same evidence, not another editable workspace.

Text labels must identify their source: **Planned activity**, **Clocked intelligence**, **Documentary evidence**, **Human action**. A larger quotation does not mean it has greater legal priority. Never use “cleared,” “approved to film,” a safety score or a green overall readiness tick as a substitute for documented scope and conditions.

## Exact foundations

| Token | Value | Semantic use |
|---|---|---|
| `surface.canvas` | `#F3F0E9` | Workspace limestone; no pattern overlay |
| `surface.paper` | `#FFFDF8` | Original/document reading and forms |
| `surface.selected` | `#EEE4D6` | Current scene/selection background |
| `surface.intelligence` | `#ECEEE5` | Model interpretation surface |
| `text.primary` | `#262722` | Main prose, headings, controls |
| `text.secondary` | `#62665D` | Context, citations, helper copy |
| `border.default` | `#D8D8CB` | Structural separators; not sole control affordance |
| `action.primary` | `#934427` | Primary action, selected keyline, restrained brand emphasis |
| `action.hover` | `#262722` | Filled-primary hover with paper text |
| `action.text` | `#934427` | Underlined inline action |
| `focus.ring` | `#165B9B` | Visible 3px keyboard ring, 3px offset |
| `state.attention.text` | `#874714` | Outstanding investigation or verification |
| `state.attention.surface` | `#FFF0D9` | Local attention message, not page-wide warnings |
| `state.error.text` | `#9A3428` | Failed save, missing custody, unresolved blocking error |
| `state.error.surface` | `#FBE8E3` | Error surface with text/icon and recovery action |
| `state.recorded.text` | `#365D4B` | Recorded human work only; never legal authority |
| `state.recorded.surface` | `#E5EFE7` | Human record confirmation |
| `state.historical.text` | `#62665D` | Historical or superseded evidence |
| `state.historical.surface` | `#E9E7E0` | Read-only history band |
| `control.border` | `#85877C` | Required when a control outline itself conveys its boundary |

Color never carries state alone. Use a plain-language label and, when useful, a small icon. Rust is an interaction color, not “danger.” Sage identifies model interpretation, not permission. The original-source paper surface remains neutral whether the document says grant, restriction or request.

### Typography

Exact implemented stacks: display/quotation `Georgia, 'Times New Roman', serif`; interface/prose `'Segoe UI', Arial, sans-serif`; identity/JSON `Consolas, monospace`. This deliberately ships without network font dependencies or an unlicensed premium face. A future font substitution is a new visual decision requiring rendering review, not an unnoticed implementation fallback.

| Role | Desktop | Narrow | Weight / line-height |
|---|---|---|---|
| Opening title | 64–68px, bounded by viewport | 44px | Georgia 400 / 1.09 |
| Scene page title | 48px | 36px | Georgia 400 / 1.1 |
| Scene title / document heading | 28–30px | 24–26px | Georgia 400 / 1.25 |
| Source quotation | 24px in split view; 29px in full reader | 22–24px | Georgia 400 / 1.6 |
| Action heading | 19–20px | 19px | Segoe UI 600 / 1.35 |
| Main prose | 16px | 16px | Segoe UI 400 / 1.55–1.65 |
| Controls / table text | 14px | 14–16px | Segoe UI 600 / 1.4 |
| Citations / metadata | 12–13px | 12–13px | Segoe UI 400 / 1.6 |
| Eyebrow | 12px sentence case | 11–12px | Segoe UI 600; ordinary tracking |
| Raw hashes / JSON | 13px | 13px | Consolas 400 / 1.6, wrap exact strings |

Avoid uppercase except source text that was actually uppercase. Do not apply tracking to body copy. Use tabular numerals for time/count columns. Do not abbreviate an original quotation to force a screen fit: allow expansion/scrolling with a clear excerpt label and access to full text. Distinguish exact quotations from design-authored summaries.

### Space, grids and surfaces

Space scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Main layout max 1440px including gutters; 4vw gutters at desktop, 20px at narrow, minimum 16px at 320px. Header is a stable brand/production/navigation row; no enormous persistent hero after entry. Context line uses 12px text and modest spacing. Main scene content begins within approximately 210–330px of the page top at desktop, including the research toolbar in study screenshots.

Wide scene grid: two `minmax(0,1fr)` columns with 48px gutter. Left plan and model; right source and human action. The source column uses one paper surface with a 3px top rule; do not nest four bordered cards inside it. Work register: flexible rows plus a 290px capability index. Reader: 250px passage index and flexible document measure. Source prose measure: 45–70 characters; full document 65–75 characters. No decorative repeated grid or dots.

Breakpoints: 1100px reduces headline/rail pressure and allows paired content to adapt; 760px switches investigation/forms to one column; 430px protects navigation and input measure. 768px is an explicitly tested tablet state, not a desktop squeezed into a phone. At narrow widths keep DOM reading order plan → model → source → action and offer a native **Next human action** jump. Keep scene context when jumping. No fixed action overlay that hides the last source lines or software keyboard.

Radii: 3px buttons/inputs, 4px small overlays, 8px dialogs; no pill treatment for ordinary state text. Primary button minimum 44px high, 20px horizontal padding. Border 1px structural, 2px quote rule, 3px selected/source keyline. Default surfaces have no shadow; an optional source preview uses `0 14px 36px #30271208`; floating dialogs use `0 18px 48px rgba(38,39,34,.16)`. Elevation indicates an overlay, not importance. Add backdrop only for actual modal decisions.

Iconography: simple 20px line icons on a 24px box, 1.5px stroke; accessible name supplied by adjacent text. Small arrows mean open/navigate, document means original, clock means recorded history, check means an action was recorded. Never use a shield/check icon to imply verified filming permission. Decorative icons are `aria-hidden`; icon-only controls require a name and tooltip but are avoided in primary tasks.

Motion: 120ms color/selection changes; 140–180ms appearance/focus transitions; no score-counting, parallax, ambient glow, faux processing or celebratory clearance animation. Respect reduced motion by removing nonessential transitions and smooth scrolling. Loading represents real work; an in-flight provider task must not animate as completed.

### Theme decision

The recommended launch contract is **light only**. A fully styled dark alternative exists as the separate Studio concept; it is not a promise of a production theme toggle. Do not auto-invert documents, inherit the old dark lime tokens or ship a partially themed mode. If dark support is later selected, define and test a complete second semantic palette before exposing it.

## Component contract

| Component | Structure / primary behavior | Important states and preserved meaning |
|---|---|---|
| Workspace navigation | Four text destinations, active underline; selected production context | Active destination, unsaved draft, staged-session switch block; keyboard/URL focus must agree |
| Production picker | Current production name opens a searchable list; create in same surface; recovered copies labeled | Empty list with create/example action; owner-locked state; version conflict; recovered-space identity |
| Production brief | Specific example or next concern, compact source/work summary | New production starts with import; no results remain explicitly not evaluated; no manufactured metrics |
| Scene register | Number, location, time and one meaningful unresolved-work phrase | Selected, pending analysis, recorded model, human follow-up; no composite clearance grade |
| Scene intelligence | Four semantic layers in the winning spread | No sources, no recorded model, uncertain provider result, historical finding, current source changes |
| Clocked finding | Exact recorded title; separate reading guide; raw fields disclosed | Recorded older contract versus current live versus controlled test versus not evaluated; uncalibrated outputs |
| Source viewer | Filename/document ID, revision, paragraph locator, exact text; full original access | Current/historical, original bytes unavailable, reviewed transcription, incomplete coverage; no inferred text |
| Document comparison | Scope/scene columns and exact passage, role language, next action | Issued wording, unsigned request, generic consent, conflicting sources; no legal hierarchy invented |
| Documentary indicator | “Document says …”, reviewer/claimed role where applicable | Document language versus human assertion versus signature authenticity explicitly distinct |
| Human review form | Persistent selected source above reviewer, decision, rationale | Required fields; exact task binding; save failure retains text; never prefill a resolved decision from another task |
| Review session preview | Individually staged decisions, exact sources, version/as-of context, verify/commit | Empty, verified, stale, changed selection, partial validation failure; no bulk approval shortcut |
| Work register | One derived list of source/review/condition/date tasks, with scene filters | Pending, blocked, evidence requested, human confirmation; complete totals and pagination |
| Prerequisite detail | Selected title, exact scene/source, date/evidence, reviewer and saved decision | Confirmed is human operational work, not authority; preserve selected older entries outside short lists |
| Timeline / schedule | Dated scenes, timezone, overnight intent; simple time rows | Unknown/undated, conflicting, overdue; no guessed geometry for invalid times |
| Revision preview | Original and candidate identities; affected scenes/reviews/checks; retained/retired/added | Exact-preview commit only; stale preview blocked; reversal creates new epoch rather than reviving old evidence |
| History | Filters, search, complete totals/page, exact selected record, linked original | Current/historical explicitly labeled; old model contracts retained; missing legacy identity remains unknown |
| Export | Current reviewed snapshot summary, JSON/Markdown, separate encrypted backup | Refuse stale reviewed snapshot; include outstanding work; evidence report and lifecycle backup clearly different |
| Recovery | Select backup → verify → inventory → typed identity → restore separate copy | Wrong passphrase/damage, missing originals, lock fence; preserve original, no auto retries or overwrite |
| Feedback | Local inline result plus concise status announcement | Pending, success, actionable failure, stale state; no toast-only error or disappearing user input |

Use native disclosure for raw provenance, model fields and full segmented source where possible. Search/history and the document register remain visible destinations; progressive disclosure must not make advanced capabilities depend on knowing an internal task code.

## Empty, pending, failure and confirmation copy

- **Blank production:** “Add your permit and call sheet. BeforeRoll will keep the originals and help you review the scene-to-source checks.” Primary: Import sources. Secondary: Explore fictional example.
- **No model evidence:** “This scene has not been analyzed against these current sources.” Offer source inspection and authorized analysis preparation; do not display a zero risk score.
- **Recorded example:** “Recorded Clocked example · older request contract.” Raw provenance explains the historical experiment. Never say “live analysis complete.”
- **Transcription needed:** “Compare the transcription with this exact original before using it for scene checks.” Show original bytes identity and named reviewer responsibility.
- **Pending save:** keep form and quotation visible; label button “Saving review…”; disable repeat dispatch, not navigation to read-only evidence.
- **Version conflict:** “This production changed. Your draft is retained; reload current evidence and review the exact selection before saving.” Keep stale drafts separate from current decisions.
- **Unknown billing:** “The request outcome is uncertain. Inspect the recorded attempt before any further action.” No retry CTA unless the existing server contract permits it; uncertainty is not failure or completion.
- **Missing original:** show which original is unavailable and how to reconnect exact matching bytes; do not claim complete custody/export/recovery.
- **Human save success:** “Review recorded for Scene 48, HW-18 paragraph 4.” Link to history and next work; no “scene approved.”
- **Reset/restore:** explicit inline/dialog scope and cancel; preserve focus on return. Evaluation reset and private recovery must never share a generic destructive action label.

These are proposed interface strings. Implementation must map them to actual server states without changing enum semantics.

## Accessibility and acceptance

Target WCAG 2.2 AA: body text 4.5:1 minimum; large text and meaningful non-text controls/focus 3:1; no color-only state. Semantic headings, named navigation, real buttons, associated labels, visible focus and status announcements. 44px preferred product control targets; no essential hover-only content. Quotes use `blockquote`/`cite`; raw strings wrap without truncating their copy value. Use `aria-current` for navigation and selected state appropriately; do not style arbitrary divs as buttons.

Support 320px width, 200% zoom, keyboard-only review/preview/commit, reduced motion and high-contrast testing. Avoid sticky layers hiding focus. On rerender restore the actual selected task/focus and retain drafts. Test full quotations longer than the example, 3,200-task coverage, history beyond page one and long filenames/identities. Prototype geometry and semantic controls were checked; a full screen-reader/zoom/forced-colors audit remains implementation acceptance, not completed research evidence.

## Whole journey

Open/select production → import exact originals → verify required transcription/source coverage → prepare/run authorized source checks → investigate a scene → compare original and scoped exceptions → record exact human reviews → resolve dated/source-bound work → preview changed source and commit exact candidate → selectively reanalyze → inspect current and historical evidence → export a current reviewed snapshot → reopen durable production → verify encrypted backup and restore a separate recovered copy.

Ordinary scenes open directly into investigation; they do not require revisiting seven instructional stages every time. The complete lifecycle remains reachable under stable destinations and contextual actions. Backend authority, version checks and custody determine allowed operations; the visual system only makes those operations understandable.
