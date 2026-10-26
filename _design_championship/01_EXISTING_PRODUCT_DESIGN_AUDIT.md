# Existing product design audit

26 October 2026. Read-only research of three independently located local projects. No secrets, user accounts, customer records, provider actions, account creation or financial operations were used. “Complete review” means the bounded source/public/demo design assessment below, not certification of every authenticated screen.

## DealForge

Found at `C:/Users/HP/dealforge`. Sources inspected: `src/app/globals.css`, `layout.tsx`, `page.tsx`, and the actual `dealforge-workbench.tsx` controller/view. The home route renders the workbench directly. Default content is the source-defined fictional Acme agreement, not a private record.

Rendered an **isolated copy** under `evidence/reference-render/dealforge`, excluding `.env`, `.dealforge-private`, Git and original documents. Existing dependency files were referenced through a junction; nothing was installed into or written to the reference project. Next/Turbopack rejected an out-of-root dependency link; Next's webpack mode rendered successfully. Next generated its own development files only in the ignored copy. Inspected Overview and AI evidence; did **not** press Analyze Deal, generate, sign or send. This preserves the zero-provider research boundary. Screenshots: [first impression](evidence/dealforge-first.jpg), [evidence state](evidence/dealforge-evidence.jpg).

Observed craftsmanship:

- Paper `#f5f3ee`, white surfaces and ink `#101215` support comfortable long-form reading. Violet `#6657e8` identifies action; trusted green `#147b59`, review amber `#ad7017`, and blocked red `#bd4545` are separate semantic families. They are not four interchangeable decorations.
- Geist Sans handles the interface; Geist Mono is available for technical values. No serif font pairing is implemented in its layout. The dark, rounded opening panel contrasts with the quiet pale navigation and page.
- The stable left navigation names actual surfaces: Source intake, AI evidence, Commercial truth, Execution and Trusted trace. The selected row uses a pale violet icon well and clear surface change. The “Trust boundary active” footer gives the workspace a durable frame.
- The lifecycle is visible before any paid action. Empty states say what has not been established and how to establish it. Generation/signature controls are visibly disabled until their prerequisites exist.
- The workbench source uses operation progress, failure messages that do not advance trusted state, evidence rows, trace events and separate authority summaries. The distinction between candidate facts and application-owned money/state is structural, not a disclaimer alone.
- Motion is restrained: 220ms entry, 260ms trace entry, an operation progress indicator and reduced-motion overrides. Its mobile section menu has explicit expanded state, active location and a one-column fallback below 390px. Those are source observations; authenticated execution and every responsive state were not exercised.

Weaknesses visible in this study: the opening panel and lifecycle consume most of the initial desktop view before editable evidence appears. Many tiny uppercase labels, badges and trust explanations compete. The initial “New agreement” hero is less specific than the fictional problem the user could actually investigate. A long anchor-based page still asks the reader to move among several separated authorities. This is strong craft with room for a more immediate demonstration.

Transfer to BeforeRoll: consistent semantic roles; stable orientation; truthful empty states; controlled next actions; evidence linked to durable state. Exceed it by showing a specific scene relationship immediately, placing source and action together, using fewer status containers and avoiding a lifecycle diagram as the opening focal point. **Do not import its violet palette, sidebar or agreement pipeline.**

## Decide

Found at `C:/Users/HP/decide-web`. Inspected `src/styles/tokens.ts`, `tailwind.config.ts`, `src/app/globals.css`, root `layout.tsx`, `(marketing)/page.tsx`, and `components/phone/PhoneCard.tsx`. Visited its public canonical site, [Decide](https://www.decide.com.ng/), and followed its Compare entry. Screenshots: [opening](evidence/decide-first.jpg), [comparison](evidence/decide-compare.jpg). No local server was needed; public content is not proof that every deployed file matches the local checkout.

Observed strengths:

- The opening states a market-specific purpose before features: Nigerian phone buying intelligence. The large headline and teal emphasis produce a clear first focal point. “Find my phone” is a direct primary action, with deals as a secondary route.
- Source tokens distinguish off-white `#f8fafc`, navy `#0f172a`, and action teal `#0f766e`. The root layout loads Geist. A Freight display variable appears in tokens but is not loaded by that layout; a token name alone is not evidence of a successful font pairing.
- The source-defined phone card prioritizes price, ownership context and comparison, not every specification. A two-phone compare tray limits choice. Trusted retail prices and marketplace context are deliberately separated in the source and public copy.
- The home page covers unavailable data with explicit waiting states rather than inventing prices. The rendered visit showed “Watching” and no spotlighted drops. The interface keeps useful routes available despite those empty feeds.
- The card contains keyboard focus, hover, saved/compare state and unavailable-price logic. The home page uses settled independent requests so one feed need not erase all discovery. These are implementation observations, not a live service reliability claim.

Weaknesses: a large Android installation/security panel competes with the core phone decision. Six instructional cards, several start-path cards, shortlist guidance and another three-step explanation repeat navigation as prose. “Just now” beside a waiting feed can look fresher than the visible evidence warrants. The first screen's wide empty area beside the heading and delayed market panel weaken balance. The public compare entry is a selection state; this audit did not sign in, create alerts or claim mobile purchasing-task acceptance.

Transfer: begin with the decision a user came to make; use specific verbs and alternatives; distinguish source quality. Improve beyond it by placing the actual intelligence example before secondary setup, consolidating guidance into contextual steps and using evidence timestamps only when supplied by data.

## Skillsroom / Skill Rooms

Found at `C:/Users/HP/skill-rooms-web` (the related API directory was located but not opened for user data). Inspected `src/styles/tokens.ts`, `tailwind.config.ts`, `app/globals.css`, public `app/page.tsx`, `components/layout/AppShell.tsx`, and shared `StatusPanel`, `MobileSheet`, `SubmitButton` components. Visited [Skillsroom](https://skillsroom.xyz/) and its public community route. Screenshots: [opening](evidence/skillsroom-first.jpg), [community](evidence/skillsroom-community.jpg). No account, wallet, payment, private room or dispute record was accessed.

Observed strengths:

- Dark navy and green/cyan provide a coherent competitive identity. The main statement is about a real user workflow: rooms, rules, proof and disputes. The artwork gives its public opening a recognizable gaming context.
- Source tokens define a disciplined palette, control height 44px, spacing, radii and state colors. The shared submit wrapper supports distinct pending labels; action feedback is provided in the shell rather than left to individual pages.
- The public page explains that payment checks, match proof, disputes and decisions remain attached to one room/tournament. That record-centric mental model is directly relevant to production evidence.
- The shell includes a mobile bottom navigation, keyboard viewport handling, safe-area footer padding, unread state and signed-in controls. These are source-backed capabilities; no claim is made that authenticated transactions were tested.
- The stylesheet contains fast/base/slow motion timings (110/180/260ms) and separate entry/glow primitives. It also explicitly keeps mobile form inputs at 16px. Its default font variables currently fall back to Arial; naming variables Geist/Space does not establish those font files loaded.

Weaknesses: the public hero includes several CTAs, three mini-panels, image treatment, another “how it works” panel and glowing green actions. The resulting visual weight is high almost everywhere. `StatusPanel.tsx` combines colored top bars, large numbers, shadows, mono uppercase captions and count animation; repeating it would recreate the very dashboard problem BeforeRoll needs to escape. Public product pages are much more legible than some of the technical naming in source, but still use repeated explanation. High-stakes transaction UX remains a source review, not authenticated browser proof.

Transfer: attach proof, state and decisions to one stable object; show pending action feedback; retain mobile ergonomics. Avoid borrowing its glow, gaming art, score panels or saturation as proof of premium quality.

## Comparative judgment

| Dimension | Strongest observation | BeforeRoll decision |
|---|---|---|
| Semantic authority | DealForge separates candidate evidence and trusted state | Separate Clocked/model, document language and human work in the layout |
| Immediate purpose | Decide states its decision domain in the main heading | Demonstrate a dolly/platform vocabulary gap within the first interaction |
| Record continuity | Skillsroom attaches proof and decisions to a room | Preserve one production/scene/source identity through every action |
| Visual restraint | DealForge's quieter page outside the hero | Use editorial contrast and spacing, not repeated decorative cards |
| Progressive disclosure | DealForge's stateful execution, Decide's shortlisting | One scene concern first; detailed identities and history on demand |
| Where to exceed all three | Each opening spends substantial space explaining infrastructure or setup | Make a real, traceable scene question the opening product experience |

No reference project was changed. The original source environments were not launched or rewritten. Public and isolated demo limits are deliberate and should not be mistaken for full product QA.
