# Editorial Intelligence Studio: design system

Implementation-ready proposal, 26 October 2026. Working browser reference: [concept G](http://127.0.0.1:3044/?concept=editorial-studio&screen=opening). Production adoption remains pending final selection. Report 06 is preserved as the earlier A proposal; this document specifies G.

## Foundations

The identity is a contemporary editorial workstation for production evidence. The source is a reading surface; the surrounding UI is calm, practical and consistent. Color does not certify authority.

| Token | Exact value | Use |
|---|---|---|
| canvas | `#f4f4ef` | Application background |
| surface | `#fffefa` | Forms, readers and quiet buttons |
| shell | `#fafbf6` | Main navigation |
| ink | `#272d29` | Headings and ordinary text |
| muted | `#61685f` | Secondary readable text |
| divider | `#d6dbd2` | Nonessential structural separators |
| control-border | `#7f877a` | Input/select/textarea boundary; use for essential button boundaries in production |
| interaction | `#8c442f` | Primary action, links and active navigation |
| interaction-hover | `#703421` | Primary action hover |
| selection | `#e7e4d9` | Selected scene, with 2px rust rule and explicit selected state |
| quiet-hover | `#ece9df` | Neutral hover/background variation |
| register | `#eeefe8` | Desktop scene register |
| interpretation | `#edf0ec` | Vocabulary relationship; left rule `#8a998c` |
| source | `#fbf8ef` | Exact documentary language |
| source-rule | `#a99a83` | Top edge of source/action sheet |
| quote-rule | `#a88b6e` | Exact quotation locator edge |
| human-label | `#35576a` | Human-authored record label |
| attention-label | `#805a24` | Outstanding conditions, requiring text |
| attention-surface | `#f2eadb` | Stale/outstanding feedback; text `#654c25`, rule `#91713d` |
| status-surface | `#e8eee7` | Successful local write/verification feedback, rule `#657c69`; never model clearance |
| error-surface | `#f6e9e3` | Error; text `#793326`, rule `#9c4032` |
| focus | `#245d82` | 3px focus ring, 3px offset |

Historical records retain normal contrast and add “Historical / original revision …”. No desaturation/opacity encodes their sole identity. No traffic-light permit state. Model fields remain raw evidence in disclosure; no fabricated confidence meter or transformed percentage.

Measured sRGB ratios: ink/canvas 12.74:1, muted/canvas 5.21:1, surface/interaction 6.98:1, attention-label/canvas 5.59:1, human-label/canvas 6.99:1, focus/surface 7.02:1, control-border/surface 3.68:1. [Calculation record](evidence/hybrid/contrast-checks.json). These sample pairs pass their declared targets; they are not a full WCAG certification. A decorative divider is not a sufficient essential control boundary.

## Typography and font delivery

| Role | Family and fallback | Weight / scale / leading |
|---|---|---|
| Product wordmark | `Segoe UI, Arial, sans-serif` | 750, 26px desktop / 25px narrow; restrained negative tracking |
| Opening headline | `Cambria, Georgia, serif` | 400, 58/1.1 desktop; 48 below 1150; 43 below 600 |
| Page headline | same serif stack | 400, 42/1.1; investigation 36; narrow 30–34 depending task |
| Section heading | `Segoe UI, Arial, sans-serif` | 600, 20/1.3; local heading 18/1.4 |
| Planned activity | serif stack | 400, 21/1.5; narrow 21/1.45 |
| Exact quotation | serif stack | 400, 24–28/1.5–1.55; comparison 23; narrow reader 25 |
| Body | UI stack | 400, 15/1.55; opening introduction 17/1.7 |
| Dense rows and controls | UI stack | 400/600, 13–14/1.4–1.6 |
| Input text | UI stack | 400, 16/1.4; native field labels 13/600 |
| Citation / secondary metadata | UI stack | 11–12/1.6; production minimum should be 12 for task-relevant metadata |
| Source identity / raw JSON | `Consolas, monospace` | 400, 12/1.6, wrapping and selectable |

Use sentence case. No body monospace, exaggerated uppercase tracking or condensed technical typography. Preserve original quotation case exactly. Never silently editorialize source text to make the page prettier. Use actual native citation/blockquote semantics and selectable text.

The three rendered candidates and rationale are in [08](08_HYBRID_SYNTHESIS_AUDIT.md) and [font-study.html](prototypes/font-study.html). Cambria's documented onscreen-document purpose supports the choice, but rendered fit determined it. [Microsoft Cambria information](https://learn.microsoft.com/en-us/typography/font-list/cambria).

For this Windows-local surface, use installed fonts through CSS; no proprietary files are bundled. Microsoft's FAQ distinguishes CSS font naming from redistributing/hosting font binaries. [Windows font FAQ](https://learn.microsoft.com/en-us/typography/fonts/font-faq). Outside Windows the fallbacks may change metrics. Before public distribution either validate Georgia/serif fallbacks at every acceptance width or select and bundle a separately licensed open font through an explicit design revision. No external font request or silent download is necessary for this proposal.

## Space, grid and surfaces

Base spacing unit 4px; preferred steps 4/8/12/16/20/24/28/32/40/48/56/64. Use 1px separators and 2px source/selection rules. Radius 4px for controls, 0–2px for selected rows; papers are rectangular. No nested rounded card language. Elevation is reserved for a production picker/study popover: `0 16px 40px #272d2925`. Ordinary evidence has no floating shadow.

Maximum application width 1600px. Desktop shell inset 32px. Overview uses a two-column story/example composition with 48px inset and 64px gap. Task content max 1100px, wide registers/readers max 1500px. Source prose should normally stay near 55–75 characters per line; larger exact quotes may use shorter lines. Extremely long text belongs in the dedicated reader, with complete source available; it must never be truncated without an explicit excerpt label and locator.

| Width | Layout rule |
|---|---|
| Above 1600 | 240px scene register, 44px investigation inset; center workspace |
| 1151–1600 | 220px register; investigation two equal flexible columns; 32px gap |
| 901–1150 | 185px register, reduced insets/gaps; preserve source readable width |
| 601–900 | Header navigation second row; native scene selector/search; no persistent sidebar; investigation remains two columns; work pathways move below rows |
| 600 and below | 20px main inset; one-column plan → interpretation → source → action; grouped exception scenes stacked; forms and revision panels stacked; evidence index reflows; history rows use readable two-column hierarchy |

Important acceptance widths are 1440×960, 768×1024 and 390×844. Avoid horizontal **page** scrolling; research toolbar may scroll internally. No fixed mobile action tray covering text. The staged-session link remains in the header. On long scenes provide a normal anchor to the next action and preserve meaningful focus after navigation. Tablet action still falls below the initial viewport: do not squeeze text merely to remove scrolling.

## Navigation architecture

One production picker and four primary destinations:

1. **Overview:** production opening/selection, saved production rows, truthful empty state and contextual intake.
2. **Scenes:** scene register, investigation, source passage selection and documentary comparison.
3. **Work:** source requests, conditions, dates and human follow-through; each row opens the correct selected source/scene.
4. **Evidence:** Sources, History, Exports & recovery as secondary tabs. Revisions originate from a source. Analysis preparation is contextual to source/scene work.

Do not create separate editable “risks,” “tasks” and “conditions” dashboards for the same work. Contextual links may enter an existing destination; they are not new sources of truth. The staged review session is a temporary transaction, reachable from the header and Work.

## Component and behavior contract

| Component | Content and interaction | States and protections |
|---|---|---|
| Production picker | Named productions, contextual identity, new/recovery entries | Locked, empty, recovered; protect staged work before switching |
| Overview example | Concrete plan/source vocabulary pair, actual recorded finding, investigation action | Recorded/evaluation identity visible; empty opens intake instead |
| Scene register | Number, activity, time, source-work summary, search and total/page controls | Selection explicit; no fabricated result for unexamined/generated rows |
| Intelligence workspace | Four labeled roles; plan and relationship left, source/action right | No-model, historical, stale and unavailable have dedicated truthful content |
| Relationship strip | Two source-bound vocabulary fragments with connecting mark | Design guide labeled separately from recorded provider finding; no grant implication |
| Source reader | Exact quote, source/revision/locator, original access, full text | Long text wraps; raw provenance disclosure; historical identity retained |
| Documentary comparison | Shared restriction, two scene groups, exact exception/request, conditions, scene entry | Desktop aligned rows; narrow complete scene groups in DOM order; no signature authentication |
| Human review form | Exact scene/quote visible; required name, decision and rationale | Draft scoped to context; native validation, retained text on refusal |
| Staged review session | Exact source/scene entries, remove, verify, explicit apply | Context/version guard; verification invalidates on change; successful apply focuses status |
| Work register | Scene, task, source and actual status; filters, pages, count | Blocked remains Blocked; saved condition reopened exactly; no “complete = permission” |
| Schedule detail | Date/timezone/overnight intent in accepted engine presentation | Don't infer calendar date from display time; server validates existing semantics |
| Source intake | Original selection, extraction/text preview, byte identity, named verification | Unsupported/corrupt/oversize feedback; real production uses accepted original-custody flow |
| Revision preview | Original/candidate, exact affected counts from server, confirm candidate | Stale refusal, selective invalidation, earlier record history, no automatic analysis |
| History | Search/type filter, honest total/page, selectable exact record | Full history accessible; human/model differentiated; earlier-contract labels preserved |
| Export | Explicit reviewed snapshot, current/history content and custody limitations | Refuse stale snapshot; ordinary evidence export distinct from encrypted backup |
| Recovery | Verify inventory, typed identity, separate restore | Wrong secret/damage/missing original/uncertain provider outcome; never retry billing |
| Feedback | One local status or actionable error with source/context retained | Status/alert semantics; do not retain a prior success as the sole explanation of a new error |
| Loading/unavailable | Static skeleton and useful explanation/return path | No false progress, new scores or auto-dispatch; reduced motion supported |

Prototype implementation details are in [10](10_HYBRID_BROWSER_ACCEPTANCE.md). Recovery and revision are explicitly labeled specimens, not real vault or engine operations. Their production implementation must use the accepted server contracts, not the prototype state.

## Accessibility, motion and feedback

Use real buttons, anchors, labels, native selects, form controls and disclosures. Selection must be visible without color via a rule plus state/label. Required task controls should target 44×44px; compact desktop pagination/disclosures in the prototype are 32–40px and need final target-size review. Inline links need adequate separation. Do not claim that the research toolbar is the production touch model.

Maintain keyboard order equal to the visible order. Mobile comparison uses two complete scene articles, not CSS reordering of unrelated cells. Scene search focuses its field when opened, then the selected heading when choosing a scene. Successful application focuses the visible status; close picker/disclosure returns focus to its trigger. Error presentation should focus an error summary while keeping fields populated. Source/original links must have clear names and no hover-only reveal.

UI hover/focus transitions are 120ms; popover appearance 140ms with at most 3px travel. No animated background, score count-up or pulsing evidence. Respect `prefers-reduced-motion`; no transition is required for meaning. One light system is proposed. A dark theme is not silently inherited from B: it requires a separate contrast/readability design and is outside this selection prototype.

Production acceptance must include keyboard-only complete journeys, screen-reader announcements, 200% zoom/reflow, forced-colors and fallback-font checks. Current numerical checks and browser focus observations establish a useful baseline, not completion of that broader accessibility review.
