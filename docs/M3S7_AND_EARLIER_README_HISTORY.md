# Archived documentation before M3-S8

# BeforeRoll — Unfamiliar Permit Championship (M3-S6)

**Clocked Build Challenge 2026 · v0.6.1 (M3-S7 owner hotfix) · 25 October 2026**

**Know the constraint before the take.** BeforeRoll is a human-reviewed, source-linked film-production preflight. Its Clocked Decide integration checks operational permit clauses against each actual call-sheet scene, looking for restrictions, scene-specific grants, and unresolved authority questions. It does not authenticate permits or authorize filming.

## Fast start (Windows, offline, zero credits)

Node.js 20+ required, Node.js 22 tested. No dependencies to install. Extract this complete ZIP, open PowerShell in the extracted folder and run:

```powershell
npm test
node scripts/evaluate_m3s6.mjs --preflight
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1'
```

Visit **http://127.0.0.1:3000**, open **Review desk**, and select **LOAD FROZEN U01 / ARCHIVE FLOOR**. Both scenes initially say **NOT AI-EVALUATED**. The challenge comparison explicitly shows the AI-off baseline as timetable/source checks only; no inference is fabricated. Select U02 for a second distinct fictional scenario. No API key needed and no credits consumed. U03 is an *offline-only segmentation failure sentinel*: a short "No drones." restriction is detected as **unscanned original source**, not silently trusted or sent to the model.

### What is actually new in M3-S6

- Two **previously untested** (with Clocked), newly written synthetic scene/permit cases: **U01**, heritage mosaic camera-tracking restriction, written registrar consent and unapproved email; **U02**, pedestrian egress and scene-limited market-stall route plan versus a draft, unissued modification. Both involve 2 scenes × 4 source segments = at most 8 separately billed Decide requests *per case*.
- **Frozen pre-execution gold assertions**, permit/scene SHA-256 fingerprints and a **read-only independent audit** at `research/M3S6_FROZEN_PREREGISTERED_GOLD.json` and `scripts/evaluate_m3s6.mjs`. Their expected scores are NOT used in the Clocked payload or app classification.
- An explicit **AI OFF versus Clocked** comparison in the live Review Desk; no Clocked probabilities appear for newly loaded cases until you authorize real calls.
- A zero-credit **unscanned source fragment** warning before making any model requests, including Unicode source offsets. This is a coverage diagnostic, not legal completeness.
- Corrected evidence labels: **SOURCE-LINKED** means exact excerpt verified, not a verified genuine permit; scene counts are **for detected clauses only**, not exhaustive conditions.
- Exact original model-response source binding, conservative review states, live/recorded provenance, per-scene dossier and stale-evidence invalidation inherited from M3-S5. **Automated tests pass locally; U01 owner Windows GUI and live Clocked results are recorded, while this M3-S7 patched release still requires Windows owner confirmation.**

**Current owner evidence: U01 completed 8/8 original live Clocked Decide requests and scored 5/5 frozen assertions (NARROW_SYNTHETIC_PASS). U02 has not yet been evaluated in the supplied evidence.** Existing owner-recorded M3-S4 results remain separately accessible and honestly labelled **OWNER-RECORDED**. New U01/U02 are NOT the old carbon-dioxide replay.

## Optional real Clocked experiment, owner-authorized only

See `docs/M3S6_OWNER_ACCEPTANCE.md` for complete, ordered Windows steps. Stop the offline server, restart with `-Live` and enter the Clocked API key **only in your local terminal**. Copy the distinct operator token into BeforeRoll. Load U01 and select **RUN CLOCKED FOR BOTH SCENES (8 MAX CALLS)** once if you authorize the possible credit charge. No automatic retries; a request can cost unknown credits; stop on partial failure. Export `BEFOREROLL_M3S6_U01_LIVE_EVIDENCE.json` and the Markdown dossier. Verify privately:

```powershell
node scripts/evaluate_m3s6.mjs --case U01 --input "$env:USERPROFILE\Downloads\BEFOREROLL_M3S6_U01_LIVE_EVIDENCE.json"
```

The checker reconstructs the original eight source-linked requests, independently verifies typed Clocked response scores, and compares **five predetermined discriminatory conditions** against the frozen gold. `5/5` would mean a *narrow synthetic pass*, **not** real-world accuracy or a guarantee of sound permitting judgments. The **local** owner throttle defaults to 256 attempts/hour (configurable via BEFOREROLL_MAX_CALLS_PER_HOUR, integer 8-20000). Each explicit two-scene batch stays capped at 8 calls, requires operator token and never retries. Actual provider-side limits are separate and not verified. Do not share API keys or operator tokens, ever.

## M3-S7 owner hotfix — read before any new live run

- Local 12-attempt/hour bottleneck raised to a configurable 256/hour default. This is an application-side limit, not the provider's quota. Existing 8-call per-batch ceiling, operator token, local-only binding, no retries, and source fingerprint checks remain.
- A raw per-clause `granted_for_scene` model score is **not** proof that general location consent overrides a separate restricted activity. The Scene Authority board only promotes a model-positive clause to **possible scene-scoped variation** if its documentary text explicitly and exclusively names that scene. Other model-positive claims remain visible with original scores and request hashes as **MODEL_GRANT_SCOPE_UNVERIFIED** questions. Such a guard is intentionally conservative; genuine general grants without explicit scene references require manual authority review rather than silent approval.
- Original U01 live evidence included unchanged at `fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json` for offline source-bound regression tests. U01 frozen gold, scoring rules and scores remain unchanged.
- Windows test path bug repaired (`fileURLToPath`) without changing the frozen evaluator.
- Dossier boilerplate updated to avoid claiming that a live-evaluated U01 is still untested.

## Why sponsor integration matters

Clocked Decide (two typed `noul` answers per independently evaluated candidate) provides semantic applicability and scene-scoped grant judgments when words differ, while the ordinary BeforeRoll timetable logic never infers those relationships. For example, the model must connect a wheeled camera dolly across a mosaic to the phrase **pressure-bearing platform across original tesserae** without a manually selected clause or hardcoded synonyms. Signed authority for Scene 47 must not leak to similar Scene 48. The UI shows both outcomes as unresolved human reviews. Clocked Extract remains part of the earlier structured intake workflow; we do not add endpoints solely for their names.

This is a **research prototype** for synthetic data. Unissued requests, missing prerequisites and variations require human review; signature/issuer authenticity, policy precedence, completeness, real-world reliability, scanned PDF/OCR, user accounts, and public deployment are **not provided**.

## Submission engineering, tracked during development

- `docs/M3S6_OWNER_ACCEPTANCE.md` — complete offline and live acceptance, one bounded owner session.
- `docs/M3S6_RESEARCH_CONTRACT.md` — falsifiable model test, predetermined expectations, necessary negative controls and claim boundaries.
- `docs/M3S6_JUDGE_DEMO_AND_WRITEUP.md` — judge-first storyboard, rubric mapping, README and write-up commitments.
- `docs/M3S6_DEPLOYMENT_SECURITY_AND_SUBMISSION.md` — build/run commands, deployment options, safety limitations and submit-only-after checklist.
- `M3S6_SHA256_MANIFEST.txt` — this release's source and fixture SHA-256 integrity snapshot.

## Prior acceptance and reproducibility

The M3-S1/M3-S2/M3-S4 owner experiments on fictional carbon-dioxide permits were executed on the real Clocked API and are preserved as original recordings in `fixtures/`. The main Review Desk has a zero-credit **LOAD VERIFIED TWO-SCENE CLOCKED RECORDING** option. `OWNER-RECORDED` is a replay, not a fresh API request. Original M3-S5 tests and workflows are retained intact, along with the older engineering history under `docs/M3S4_AND_EARLIER_BUILD_HISTORY.md`.

**Keep the live operator-gated API on localhost.** A publicly shareable demonstration must serve only known synthetic recorded fixtures, without an exposed billable Clocked proxy.

---

## Archived v0.5.0 readme (historical scope, superseded by sections above)

# BeforeRoll — Scene Authority Intelligence

**Clocked Build Challenge 2026 · M3-S5 v0.5.0 · 25 October 2026**

**Know the constraint before the take.** BeforeRoll is a film-location preflight prototype that compares fictional shooting schedules with written permit conditions. Clocked Decide evaluates each segmented permit clause **against each source-bound scene**. The Review Desk then presents relevant restrictions, scene-specific documentary variations, other potential scope questions, exact quotations, and what still requires human verification.

> **No filming clearance.** This is a research prototype, not a legal, insurance or permitting service. Document authenticity, signer authority, the precedence of amendments, scene/date/location scope, and all operational prerequisites require a responsible human. Do not upload real confidential production documents to a public demo.

## Start in under two minutes — Windows

**Prerequisite:** Node.js 20+ (Node 22 tested). No `npm install` is necessary; the application has no external dependencies.

1. Download and extract the complete `BEFOREROLL_M3_S5_SCENE_AUTHORITY_INTELLIGENCE_v0_5_0.zip` archive.
2. Open PowerShell inside the extracted application folder and execute:

   ```powershell
   npm test
   powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1'
   ```
3. Visit `http://127.0.0.1:3000` in a browser. Choose **Review desk**.
4. Click **LOAD TWO-SCENE SOURCE DEMO (31 RECORDED / 32 NOT EVALUATED)**. This demonstration requires **no API key and consumes no credits**. It loads actual recorded Clocked Decide answers for Scene 31; Scene 32 stays explicitly unassessed.
5. Inspect Scene 31's **Scene Authority** card, the general restriction, the separately quoted signed variation and all outstanding checks. Select Scene 32 to see the unevaluated state.
6. For the full paired result, click **LOAD VERIFIED TWO-SCENE CLOCKED RECORDING (0 CREDITS)**. This reloads the genuine owner-run M3-S4 eight-call response **as an explicitly recorded replay**, checking both source hashes and individual quotes. It is never labeled as a new live result. Scene 31 should show a restricted activity with a conditional grant; Scene 32 should show a related source condition without inheriting the grant.
7. Export the Markdown dossier (top-right **EXPORT DOSSIER**). It now separately reports **source-intake provenance** (`MANUAL`, `RECORDED`, `LIVE`) and **Clocked Decide execution provenance** (`LIVE`, `OWNER-RECORDED`, `NOT EVALUATED`), and never treats `0 documented mismatches` as `0 AI concerns`.

### Full owner-recorded two-scene evidence (optional zero-credit inspection)

The exact **owner-run live two-scene Clocked results** (8 original requests, 8 reported credits, 2 scenes) are preserved in `fixtures/audit/M3S4_OWNER_TWO_SCENE_LIVE.json`. The replay is loaded only when you click **LOAD VERIFIED TWO-SCENE CLOCKED RECORDING**, and clearly shows **OWNER-RECORDED** provenance. The default two-scene demo intentionally leaves Scene 32 unevaluated until that action. The bundle includes a local read-only auditor test over those exact originals, and its Scene Authority outputs can be reviewed from the command line via tests. No fabricated responses are presented as live.

For a judge walkthrough showing both scene outcomes in one browser session, use the verified zero-credit replay and explain that the original responses came from eight prior owner-run real Clocked API calls. Do **not** misrepresent this playback as a fresh live execution. The separate live mode remains available below for an authorized new run.

## Deliberate live analysis — optional, billable

Stop the offline server with Ctrl+C. Restart:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1' -Live
```

The local launcher prompts for your **Clocked API key in the terminal** and generates a separate operator token. Never paste your API key into the browser or public repository. Open **Review desk**, select **LOAD TWO-SCENE SOURCE DEMO**, enter the separate operator token, and click **RUN CLOCKED FOR BOTH SCENES (8 MAX CALLS)**. Confirm the one-time warning only if you authorize up to eight **sequential, separately billed** Clocked Decide calls. **No retries**. Charges per call are not guaranteed; partial responses/unknown charges must be reviewed before any new attempt. Export the batch JSON and Markdown dossier for audit. API availability and behavior may vary.

**Safety:** Run on localhost; do not deploy this live endpoint with a pasted key without additional production abuse controls. Intended only for synthetic documents.

## Why Clocked matters

The deterministic engine **does not** contain a `dry ice = manufactured vapor` synonym rule, cannot interpret arbitrary condition language, and cannot decide whether a narrow signed variation relates to a scene. Clocked Decide supplies **two typed `noul` assessments per individual clause:** whether the scene activity is related to that clause, and whether that clause **states** a documentary grant for that scene. BeforeRoll validates the source hashes/Unicode offsets and keeps interpretations as **review**, not legal conclusions. Clocked Extract also supplies the separate earlier field-reading prototype; numerical time calculations and call-sheet row parsing are intentionally deterministic.

**Observed owner-run synthetic two-scene result** (25 October 2026 WAT; saved from the preceding M3-S4 owner experiment):

| Assessed clause | Scene 31 | Scene 32 |
| --- | --- | --- |
| General vapor restriction — model relevance | 98.88% | 98.96% |
| Signed variation SV-31 — model relevance | 99.08% | 16.56% |
| Signed variation SV-31 — model documentary grant | 98.54% | 4.02% |

The model treated the general restriction as relevant to both fictional carbon-dioxide effects but did **not** transfer the Scene 31-specific grant to Scene 32. These are **uncalibrated model scores on one crafted synthetic pair, not measured real-world accuracy.** Source hashes, raw original excerpts and each request fingerprint are preserved in the evidence JSON.

**Caution about extension wording:** the clause *“Any extension to Scene 32 remains unapproved”* was strongly linked to Scene 32 by the model, but the original call sheet never states an extension request. The Scene Authority board therefore lists additional clauses as **scope questions**, never as a confirmed filming prohibition.

## What M3-S5 adds

- **Scene Authority board** in the real Review Desk: the primary source condition, possible scene-scoped documentary variation, secondary/ambiguous clauses and the human verification still needed. No hardcoded scene-number rules or hazard vocabulary determine semantic classifications.
- **Traceable source citations**: exact clause quotations, Unicode character offsets, model scores, per-request SHA-256 identifiers and separate provenance for source intake vs model execution.
- **Unambiguous dossier**: explicit `Clocked REVIEW findings` separate from deterministic discrepancies; scene-level narrative summaries and exact evidence. A manual intake can still have *live* Clocked Decide results.
- **Fail-closed limitations**: partial/unevaluated scenes stay unresolved; edits invalidate old judgments; an extension-related model link cannot be presented as a proven violation.
- **Regression coverage**: original M3-S4 tests plus nine M3-S5 source-audited summary and static-delivery tests, covering two different scenes, tampering, partial responses, unclear findings and unknown clauses.

## Tested scope and limitations

**Supported prototype**: two unchanged `Scene N | LOCATION | HH:MM-HH:MM | activity` rows and at most eight combined Clocked Decide calls across at most four deterministically segmented candidates per scene. This is **not exhaustive semantic discovery**. Compound, long, unusually punctuated or multi-paragraph clauses can be missed; the application reports uncovered fragments. User-edited scene values lose original source identity and require separate review. Model percentages are not calibrated truth. A `NO_SEMANTIC_LINK_DETECTED` classification does not establish unrestricted filming permission.

**Not delivered**: trusted identity/signature verification, legal review, full signed-amendment precedence, broad blind real-world evaluation, production-grade uploads/OCR, access-controlled deployments, persistent multiuser collaboration or final hackathon submission.

For acceptance details see `docs/M3S5_OWNER_ACCEPTANCE.md`; for the product and honest competition demonstration see `docs/M3S5_JUDGE_DEMO_AND_WRITEUP.md`; for earlier engineering history see `docs/M3S4_AND_EARLIER_BUILD_HISTORY.md`.

**No key or token is stored in project files; credentials are entered locally in live mode.**
