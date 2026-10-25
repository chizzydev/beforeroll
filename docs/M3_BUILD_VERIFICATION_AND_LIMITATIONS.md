# M3-S1 build verification receipt — 24 Oct 2026

**Produced code:** Cumulative BeforeRoll v0.2.0, a new Clocked Decide operator-gated semantic-lens UI + server route. M2 source-trust and review/timeline/dossier retained. No private API key was accessible to the build environment.

**Automated:** `npm test`: 40 tests, all pass (29 baseline M2 + 11 M3 including one unseen-scenario assertion). The semantic route was exercised against an injected **mock transport** with fake keys, two probabilities, request fingerprint, no-authority semantics and credit header; this is not a real Clocked acceptance.

**Browser harness:** Chromium local `page.set_content` harness with local fixture fetch stubs: opened existing M2 UI, selected Semantic Lens M3A, verified source clause picker, disabled live button in replay, explicitly *No semantic insight yet* display, switched M3B, zero browser uncaught exceptions. This is not a browser-over-HTTP full owner run because local browser navigation is restricted by the sandbox. Screenshot in `docs/M3_LOCAL_BROWSER_HARNESS_NO_LIVE_RESULT_1440.png`.

**Endpoint schema:** Uses Clocked Decide request `{state, questions:{activity_link:{type:'noul',instructions,criteria}, granted_for_scene:{type:'noul',instructions,criteria}}}` with response `answers.<id>.noul` numbers (0..1), as illustrated in publicly published official Clocked Python and JS SDK examples. Actual API behavior must be verified with owner's key. No retries or silent permission.

**Important limitations:** M3-S1 lets a HUMAN select an operative source clause after neutral punctuation segmentation; Clocked makes the SCENE-CLAUSE semantic link and the narrowly scoped issued-grant judgment. It is **NOT** an automated novel-clause discovery system yet. No model insight is fabricated for replay. No real Clocked Decide call, no independent external validation, no real permit authority verification, no production-ready document ingestion, no guaranteed winning claim.

**Future gate:** Owner live API response for preregistered M3A and optionally M3B/M3N; verify score signs and citations independently. If no meaningful semantic link, downgrade/kill this slice rather than replace the result with local synonym rules. Only once real behavior passes should the judge video present the moment as achieved.
