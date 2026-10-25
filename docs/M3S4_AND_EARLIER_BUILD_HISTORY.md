# BeforeRoll M3-S4 v0.4.0 — Multi-Scene Clocked Preflight

**Live Clocked semantic inference now supports TWO independently sourced scenes in one bounded, owner-authorized batch**, with per-scene evidence, incomplete-run safety, credit accounting and an explicit `NOT AI-EVALUATED` state. Existing M3-S3 Review Desk, original M3-S2 owner-recorded evidence, timeline, corrections, evidence inspector and Markdown dossier are retained.

**One-minute start**: `npm test`, then `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1` in Windows PowerShell. Open `http://127.0.0.1:3000`, click `LOAD TWO-SCENE SOURCE DEMO`, inspect Scene 31 and Scene 32. Scene 31 is owner-recorded Clocked replay on synthetic text; Scene 32 is **NOT EVALUATED** in replay mode. This costs zero credits.

**Deliberate live two-scene gate**: stop server; restart with `...Run-BeforeRoll.ps1 -Live`; paste the Clocked key **locally at the masked terminal prompt only**; paste separate `LIVE_OPERATOR_TOKEN` into the Review Desk. Click `RUN CLOCKED FOR BOTH SCENES (8 MAX CALLS)` and confirm once. Exactly 2 original unedited scene rows × 4 segmented candidate clauses = **up to 8 separately billed Decide requests**, sequentially, **without retries**. Each call's price is unknown; the total is not a hard financial cap. If an upstream request fails, remaining scenes are marked NOT EVALUATED; billing may be unknown. Export the JSON evidence and dossier, review for secrets before sharing. Use fictional inputs only.

**Version support**: Node.js >=20; no dependency installation required. Owner instructions: [M3S4_OWNER_ACCEPTANCE.md](docs/M3S4_OWNER_ACCEPTANCE.md). Technical change report: [M3S4_TECHNICAL_CHANGELOG.md](docs/M3S4_TECHNICAL_CHANGELOG.md). Competition demonstration and scoring map: [M3S4_JUDGE_STORY_AND_COMPETITIVE_CONTRACT.md](docs/M3S4_JUDGE_STORY_AND_COMPETITIVE_CONTRACT.md).

**Non-negotiable truthfulness:** typed Decide outputs are model probabilities, not legally validated facts. The app cannot establish issued permit authenticity, prerequisite fulfillment, document supremacy or unrestricted permission; source segmentation can miss operative conditions. No real Clocked multi-scene live test has been run during packaging. **DO NOT use this prototype for filming clearance.**

---

## Earlier implementation history (M0–M3-S3)

# BeforeRoll M3-S3 v0.3.0 — Clocked in the Review Desk

**24 October 2026 · cumulative runnable release · Windows owner acceptance pending.**

**The decisive change:** BeforeRoll's actual Review Desk now displays scene-specific semantic findings produced by Clocked Decide's multi-clause sweep, with the original permit quotation, original call-sheet row, displayed model probabilities, conservative human-review classification, and an exportable dossier. Previously these outputs existed only in a separate Semantic Lens research panel. The scene-specific model judgments now change the *product's main finding list*, without hardcoded hazard synonyms or claims of legal clearance.

## What the user can do (no API key or credits required)

1. `npm test` — 55/55 automated tests were passed during packaging (original 47 plus eight M3-S3 safety tests).
2. `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1`
3. Open `http://127.0.0.1:3000`, **Review desk**, and click **LOAD REAL CLOCKED REPLAY DEMO**.
4. The app loads the *exact fictional M3B permit and Scene 31* together with **four actual owner-recorded Clocked Decide outputs**, not invented AI results. It verifies source hashes, source spans, response identity, model answer shape and classification before placing any findings on the desk.
5. Select **Clocked found a possible conditional authorization**. The Evidence Inspector shows the complete `SIGNED VARIATION SV-31` original clause beside the exact original scene row. Both are documentary *claims*, not proof of authenticity or fulfillment of mats and steward requirements.
6. Select the general vapor prerequisite. It also remains an active review; a conditional grant does not erase other conditions.
7. Click **EXPORT DOSSIER**. Review the Clocked findings, quotes, request hashes and not-clearance caveat in the Markdown file.
8. Go to **Source intake**, append a new phrase to the permit and select **APPLY TEXT / CLEAR OLD EXTRACT**. Return to Review Desk: all formerly linked Clocked findings are gone. A changed source requires a new deliberate analysis.

**IMPORTANT:** Replay is a faithful local presentation of the owner's *previously captured* Clocked evidence; it does not make a new model inference. The UI labels it `OWNER-RECORDED CLOCKED`. This recorded demonstration is useful for judges who do not have Clocked credentials and spends **zero credits**.

## Deliberate real Clocked analysis of a scene

Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1 -Live`. Paste the API key into the local terminal prompt; do **not** put it into the browser. Copy the distinct `LIVE_OPERATOR_TOKEN` displayed by the local runner into the Review Desk's operator field. Load a supported permit and schedule via Source intake (explicit `Scene N | LOCATION | HH:MM-HH:MM | Activity` rows), select a scene, click **RUN CLOCKED FOR THIS SCENE**, and confirm the credit warning. This sends **1–8 sequential separately billable Clocked Decide requests** using the server-side key, no retries; the user's USD $0 overage setting should remain enabled. Each individual cost is unknown. Up to 12 attempted calls/hour on the server. The same action may be repeated on another scene only with separate explicit authorization and sufficient hourly slots; no background automation exists. Any failed or incomplete sweep remains unresolved.

**Critical distinction:** The site *enumerates candidate sentences locally*. Clocked decides which candidate conditions are semantically relevant to the selected scene; it is **not guaranteed to discover every operative legal clause**. Omitted/fragmented conditions, actual authenticity, authority, effective-date scope, exceptions, other documents, safety prerequisites, unsupported scene layouts, and real-world reliability remain for human review. The current support is plain text. Clocked model scores are not calibrated guarantees.

## What has genuinely been established

- **Earlier R7 Extract:** owner-recorded successful permit reading, real 20-credit test, but call-sheet row extraction and some variation provenance failed. Deterministic scene-row parsing is intentional.
- **M3A/M3N/M3B:** three owner-recorded Clocked Decide pairwise outcomes: unfamiliar vapor paraphrase high relevance, unrelated pyrotechnics low relevance, conditional signed variation high relevance/grant — only on three synthetic instances.
- **M3-S2 M3B:** all four source candidates sent to real Clocked Decide; the saved result contains an independently source-matched conditional grant clause (99.08% activity, 98.54% documentary grant), general vapor restriction (98.88% activity, 0.24% grant), irrelevant heading (1.07%), and ambiguous Scene 32 clause (49.96%). Four reported credits. This is the exact replay displayed on M3-S3's main Review Desk.
- **M3-S3:** these authentic *recorded* outputs are now source-bound to Scene 31 inside the main product UI, can be inspected, and are included in the exported dossier. The server reuses the existing owner-tested Clocked `/clocked/decide` endpoint for an optional live scene sweep. **M3-S3 live scene-to-desk acceptance has not yet occurred.** No new Clocked credits were spent creating this release.

## Competition scoring, demo and delivery

The intended headline is: **“A coordinator loads a scene and unfamiliar location agreement; Clocked identifies which operational conditions matter, recognizes a narrowly scoped written variation, and BeforeRoll turns those model judgments into an inspectable scene review.”** Deterministic code handles exact source integrity, clocks and safety; Clocked owns the *unanticipated semantic activity-to-condition link*, as demonstrated by the owner-recorded positive/negative/conditional controls. This is a **working pilot**, not reliable automatic filming clearance.

See `docs/M3S3_OWNER_ACCEPTANCE.md`, `docs/M3S3_TECHNICAL_CONTRACT_AND_LIMITATIONS.md` and `docs/M3S3_JUDGE_TOUR_AND_WRITEUP.md` for the complete owner acceptance, architecture, sponsor relevance, and prospective submission narrative. Earlier M0–M3-S2 documentation follows below for continuity; historical “not yet tested” statements in those sections refer to **those older releases**, not to the current status.

---

# BeforeRoll M3-S2 v0.2.1 — Clocked Condition Sweep

**New cumulative build, 24 October 2026.** This increment responds to the Clocked sponsor-indispensability challenge. After three owner-run Decide judgments passed narrow preregistered synthetic controls, the operator no longer needs to choose the relevant permit clause before running a scene-conditioned analysis. **One deliberate Clocked Decide call per detected clause** compares the full scene against the source clause, with no hazard keyword filtering or simulated AI results. Up to eight clauses, with explicit owner confirmation, in-order calls, and fail-closed partial evidence. Source-fragment omissions are disclosed. The application does not resolve legal authority or grant filming clearance.

**Verification:** 47/47 tests pass, mock transport and Chromium offline harness pass; **new M3-S2 real Clocked sweep has not yet been run or accepted**. Earlier M3-S1 triad is audited separately. See [`docs/M3S2_SCOPE_ACCEPTANCE_AND_LIMITATIONS.md`](docs/M3S2_SCOPE_ACCEPTANCE_AND_LIMITATIONS.md) and `README_FIRST_WINDOWS.txt`.

# BeforeRoll v0.2.0 — M3-S1 Clocked Semantic Lens (24 October 2026)

**Runnable cumulative Windows prototype.** Retains all M2 review-desk, timeline, source-trust safeguards, manual corrections and Markdown export, and adds an operator-gated **live Clocked Decide semantic-link experience**. Node.js 20+, dependency-free. The new semantic link has **NOT yet been executed against the real provider**; it is implemented and tested through mocked transport, with **no fabricated replayed Decide outputs**.

### The new sponsor-critical experience

A filming permit says introduced **airborne particulates or manufactured vapor** require countersigned conservator authorization. A scene instead describes making white wisps by allowing pellets of solid carbon dioxide to turn into gas. The old deterministic rules can calculate times but **do not link these semantically different activities**. M3-S1 presents the exact clause and original scene, then asks **Clocked Decide** two typed `noul` questions: does the activity fall under this clause, and does this same excerpt establish a specific issued grant? Scores produce only **REVIEW** or **UNRESOLVED**, never legal clearance. The key stays on the server.

**Critical limitation:** The operator chooses the whole permit clause from source-preserving punctuation-based candidates; automated clause discovery remains future scope. The M3 owner-live test and contrasting signed/no-link cases are still REQUIRED before a Clocked-indispensability claim.

### Start locally

```powershell
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1
```

Visit `http://127.0.0.1:3000` → **Semantic lens** → **UNSEEN VAPOR PARAPHRASE / M3A**. In replay, it correctly shows **NO SEMANTIC LINK / NOT EVALUATED** and cannot consume credits.

For a separately authorized actual Clocked call, stop the server and relaunch:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1 -Live
```

Enter the Clocked API key only in the locally masked terminal prompt, **not the web page**. Copy the distinct printed `LIVE_OPERATOR_TOKEN` into the Semantic lens operator field. Click **RUN CLOCKED SEMANTIC LINK** once and confirm. The server makes at most **one actual Decide request** for that click; no automatic retries, server-side attempt limit, and unknown per-request credit cost. If returned, click **EXPORT ORIGINAL CLOCKED SEMANTIC EVIDENCE (JSON)** and inspect it before sharing. Do not share key or token. Reported probabilities are not ground truth.

**Owner acceptance instructions:** [M3 live gate](docs/M3_OWNER_LIVE_GATE.md). **Judge-facing copy and truth boundaries:** [M3 storyboard](docs/M3_JUDGE_STORY_AND_SUBMISSION_CONTRACT.md). **Existing M2 product documentation follows unchanged below.**

---

# BeforeRoll — Source-backed film permit preflight

**Historical M2 v0.1.2 baseline (retained below) · October 24, 2026**  
**Status: Runnable engineering slice, NOT a final challenge entry or filming-permit certification.**

> **Know the constraint before the take.** BeforeRoll helps a production coordinator compare a draft call sheet against the written conditions of a film-location permit. It highlights planned scenes needing attention, shows the source quotation behind each finding, and exports a human-review dossier. It never issues permission, verifies a document's legal authenticity, or labels a shoot “safe to film.”

![M1 CSP-safe review-desk UI rendered in Chromium using recorded R7 synthetic fixtures](docs/M1_CSP_SAFE_OWNER_PREVIEW.png)

## M2 owner findings, fixes and remaining scope (24 October 2026)

**Source of acceptance:** Windows screenshots provided by the owner and the exported `BEFOREROLL_PREFLIGHT_F01_2026-10-24.md`. See `docs/M2_OWNER_READOUT_AND_NEXT_GATE.md`. These prove visible GUI behavior, not end-to-end browser automation or an independent authenticity check.

**Observed M1 PASS:** Scene 16 West Plaza/drone warnings, signed-variation Scene 23 timeline and uncertainty, acknowledgement retained while findings remain open, Markdown export with cited document excerpts, manual scene time edit, and permit-edit invalidation of stale Clocked extracts. The exported dossier preserves the original 17:20 finding as **OPEN**, and the coordinator sign-off as **ACKNOWLEDGED, NOT CLEARED**.

**Two observed defects corrected in M2:**

1. The evidence inspector previously displayed `SOURCE-LINKED` even when the selected sign-off item explicitly said no issued-permit citation existed. Its badge and explanatory text now reflect **PERMIT + SCENE LINKED / SCENE SOURCE ONLY / PERMIT CITED ONLY / CITATION UNVERIFIED / NO ACTIVE FINDING**, depending on actual evidence. The exported dossier now includes the same per-finding classification.
2. Changing Scene 15 from ending at 17:20 to **16:10** eliminated the actual amplified-sound violation but incorrectly created `Amplified playback authorization unknown` even though the replay contained a source-verified **16:15** cutoff. Fixed: a valid known sound limit yields a mismatch only if the scene exceeds the limit. Missing/untrusted cutoffs still require review. Human-edited rows remain flagged for independent sign-off.

**M2 tests:** 29 Node test cases, including a local fake transport exercising the app's operator gate, Clocked Extract request schema, returned credits and server-only secret. No real Clocked calls or credits were used for this build. The real owner-key app-route smoke test, unsupported-layout UX, and further independent benchmarks are still open.

**Trust rule:** No finding should be presented as filming permission, whether the status is cleared in a local review checkbox, confirmed by a manual correction or returned by Clocked.

---

## Quick start — Windows (5 minutes, no npm install)

**Requirements:** Node.js **20+** and Windows PowerShell 5.1 or newer. The ZIP contains all source and dependencies (there are **no npm dependencies**).

1. Extract the supplied `BEFOREROLL_M2_SOURCE_TRUST_SOUND_FIX_v0_1_2.zip` into your Downloads folder (or another fresh destination).
2. Open PowerShell in the extracted `BEFOREROLL_M2_SOURCE_TRUST_SOUND_FIX_v0_1_2` folder.
3. Run the tests:

   ```powershell
   npm test
   ```

4. Start the safe **recorded-demo mode**:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1
   ```

5. Open **http://127.0.0.1:3000** in Edge/Chrome. No API key is needed and no Clocked credits are consumed. Stop with **Ctrl+C** in PowerShell.

If you prefer not to use the PowerShell helper, `node server.mjs` starts the same replay-only server. `npm start` is equivalent.

### What you'll see, and what to click

The app opens on **FP-1042 / East Courtyard**, using **actual Clocked Extract outputs recorded by the project owner** on **fictional** text on October 24, 2026. The call sheet has three structured scenes.

1. **Scene 15** is selected initially. It ends at **17:20**, after the issued **17:00** photography deadline. Amplified playback ends at **17:20**, after the documented **16:15** cutoff. Click either finding; the right inspector shows the original permit and the matching call-sheet row. Clicking **OPEN ↗** highlights the text in the full original document.
2. Click **Scene 16** to inspect West Plaza, expressly excluded from the issued permit, and a drone activity expressly not authorized by that permit.
3. Click **Scene 14**. It has no detected timing or sound mismatch, but the **call-sheet coordinator sign-off remains PENDING**. This is a review question, **not** proof of clearance.
4. Click **Source intake → LOAD VARIATION V-9**. A real recorded R7 response correctly extracted a **20:30** signed variation but linked some location/date fields to the **wrong paragraph**. BeforeRoll refuses to automatically treat that extension as approved for a given scene; Warehouse North is flagged for **authority review**. The unapproved **Warehouse South 22:00 request** is not elevated into authorization. A scene past even the stated 20:30 extension receives a separate warning.
5. In **Source intake**, change a scene's time or location, then click **APPLY MANUAL CORRECTION**. The timeline updates but marks the correction as **human-entered and awaiting sign-off**. Source quotes still show what the original row said.
6. Click a finding's **MARK REVIEWED**. This only records that someone looked at it; it does not clear the mismatch. Export the **Dossier** using the top-right button. The `.md` dossier includes per-scene findings, original source quotations and review state.
7. Switch to **How it works** for the five-step method, explicit research evidence and the product's limitations.

**Do not put real client documents or personal information into a public demo deployment.** This prototype works best with the included fictional fixtures.

## Replay mode versus live mode

### Recorded demo / zero credits

In replay mode, the API outputs in `fixtures/R7_F01_RECORDED.json` and `fixtures/R7_F02_RECORDED.json` are curated copies of **real owner-run Clocked responses** to the original **synthetic** inputs; this is **not** an LLM simulator. `F03` contains the real **failed AI call-sheet extraction** and is included as negative evidence. The app deliberately uses deterministic source-row parsing instead of the F03 list extraction. Every screen visibly labels recorded data. The test data contains no real municipal documents.

### Live Clocked Extract / credit-consuming, opt-in

**Only run this on your trusted personal machine**, with **synthetic** plaintext test documents, to verify the actual integration. Stop any other local server using port 3000 first.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1 -Live
```

- The PowerShell script asks for the **Clocked API key locally using masked input**. It is held in an environment variable only while the local server runs; it is never printed or sent to the browser.
- The script prints a separate, short-lived **`LIVE_OPERATOR_TOKEN`**. Copy **that token** into **Source intake → Operator token** in your local browser. **Do not enter your Clocked API key into the browser.**
- Live mode remains disabled unless the server has a key, a separate operator token and `BEFOREROLL_LIVE_ENABLED=true`.
- Click **RUN LIVE EXTRACT**. Confirm the browser's credit warning. The server sends the current permit text to `POST https://clocked.rezolve.ai/clocked/extract` exactly once, with no automatic retries, and returns extracted fields and any reported credit charge.
- Review the returned snippets. An HTTP 200 is **not** proof of correct interpretation. If the request fails, do **not** immediately retry: billing may be uncertain.
- Live access is **operator-token-gated** and limited to **12 attempts/hour per server process** for this local prototype, **not** a hard spending/billing cap. Leave Clocked paid overages set to **$0**.
- Stop the server with Ctrl+C. Restart without `-Live` to return to zero-credit replay.

**IMPORTANT:** Live integration code has been compiled/validated, but it has **not** been called with your private API key from this build environment. The successful R7 owner-run Extract calls were made using the separate R7 probe runner; this app's live route still requires one owner-run smoke test. The M2 live-route transport has additionally been exercised **with a local mock transport and a non-secret dummy key**, not against the real provider.

## Input format and correctness model

For this prototype, **only** explicitly delimited, plaintext scene rows are supported:

```text
DAILY CALL SHEET - Thursday 5 November 2026
Scene 14 | EAST COURTYARD | 15:30-16:05 | Interview, no playback.
Scene 15 | EAST COURTYARD | 16:05-17:20 | Music montage with amplified playback.
Scene 16 | WEST PLAZA | 14:00-14:25 | Drone aerial.
Production coordinator sign-off: PENDING.
```

Unsupported `Scene` rows are shown as **unsupported**, not silently dropped into an apparently complete schedule. Overnight shoots, actual PDF tables, ambiguous timings, timezone switches, group permits, multi-location supersession and legal permit status are **not** automatically resolved. Use local time strings with 24-hour `HH:MM` notation. Missing values and source anchors are *unresolved*; they're not “allowed.”

The engine never accepts a Clocked `confidence: 1` value as a correctness guarantee. It checks the returned text against the original Unicode **codepoint** span. The signed variation also requires evidence from the **same signed variation paragraph** before any automatic scope application. That specifically addresses problems discovered in the owner-run R7 audit.

**Rule split:** Clocked interprets unstructured issued permit language. Deterministic code validates source offsets, parses explicitly structured call-sheet rows, compares exact locations and 24-hour deadlines and creates review findings. A human owns disputed scope, document authenticity, final permit applicability and operational approval.

## Reproduce the evidence and tests

```powershell
npm test
```

The project has **24 offline Node test cases** covering real recorded field responses, source-span fidelity, row-local source evidence, false positive avoidance, issued-versus-requested distinctions, signed-variation provenance failure, corrections, unknown permissions, Unicode codepoints, unsupported rows and HTTP/server protections. It does **not** claim performance on genuine film-office PDF packs.

The technical research is described in `docs/RESEARCH_EVIDENCE_AND_GATES.md`. A screen-by-screen demo script is in `docs/JUDGE_TOUR_AND_WRITEUP.md`. Code is intentionally separated:

```text
server.mjs              Static UI server + operator-gated Clocked Extract API
src/engine.mjs          Pure deterministic parsing / scope / time / provenance rules
public/index.html       UI shell
public/styles.css       Studio-dark interface
public/app.js           Interactive review desk and human-correction flow
fixtures/R7_*           Curated authentic Clocked research outputs on synthetic text
tests/*.test.mjs        Offline unit and server-level checks
scripts/Run-BeforeRoll.ps1 Masked-key local launcher
docs/                   Research evidence, design contract, judge script, UI captures
```

No database; no login; nothing is saved to disk by the app. Refreshing resets local edits. Export a Markdown dossier if you need the current review trail. Deploying this local Node server to Vercel unchanged is **not** supported; a future Next.js/App Router migration or compatible hosting adaptation is tracked in `docs/NEXT_INCREMENT_CONTRACT.md`.

## Limitations, security and challenge transparency

- This is a **research-grade prototype**, not a real permit validation system. No municipality or film commission has authorized or reviewed it.
- Built from authored fictional examples; **there is no independent customer validation, no authentic-location-permit accuracy benchmark and no market superiority claim**.
- The recorded API responses correspond to R7 tests and **not** to any new live API call made by this build. The live handler still awaits owner acceptance.
- Sample screenshots were rendered in headless Chromium using the real application UI/engine with locally injected recorded fixtures. Sandbox browser networking prevented a complete browser-over-HTTP test; server routes were independently tested through Node.
- Auto-approval, OCR/PDF, cross-document authority graph, team sharing, accounts, external SMS/email, paid deployment and official submission have **not** been implemented.
- Because the contest rewards both integrations and explanation, any final challenge submission must explicitly demonstrate Clocked's source-reading value over deterministic alternatives. **No final concept COMMIT has been declared**. Do not add token endpoint calls solely for scoring breadth.

See [BUILD CONTRACT](docs/NEXT_INCREMENT_CONTRACT.md) for the non-negotiable remaining scope and [JUDGE TOUR](docs/JUDGE_TOUR_AND_WRITEUP.md) for the judged story. This README is a deliberately completed **first-day scored deliverable**, not a submission-night afterthought.

## M1 owner-screen correction (v0.1.1)

Windows screenshots from the initial owner run established that the review desk and evidence drilldown render, but showed a **critical timeline defect**: the planned-window bar disappeared and the 17:00 cutoff marker appeared at the left edge. The server correctly enforced `style-src 'self'` in its Content Security Policy; M0 inserted dynamically calculated positions using HTML `style` attributes, which Chromium blocked. M1 keeps the strict CSP and moves geometric positioning to narrowly validated DOM `element.style` property assignments after rendering. All template inline-style attributes were removed; other visual labels received CSS classes.

The timeline now uses a dynamic hour axis for later Warehouse scenes rather than clipping everything beyond 19:00. It distinguishes a source-verified documented cutoff from an unverified human-entered value. The call sheet header is now **Scheduled scenes**, not **Today's scenes** (the fictional shoot is in November, not the actual current day). No business-rule thresholds or Clocked request schema were changed. The new tests include timetable math and browser CSS/CSP checks. See `docs/M1_OWNER_ACCEPTANCE.md`.
