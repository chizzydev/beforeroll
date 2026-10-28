# BeforeRoll — Owner Acceptance / Consolidated Refinement Register

**Session:** 2026-10-26 (Africa/Lagos)  
**Running baseline:** Editorial Intelligence Studio + Windows editorial refinement v1.0 (523/523 Windows tests reported PASS).  
**Acceptance method:** Owner browser screenshots at local evaluation-mode server; observations only, not direct source/runtime instrumentation.  
**Change policy:** Record issues; no code modifications until the coordinated owner acceptance is finished. Preserve Clocked recordings, exact source/provenance, saved history and task identity.

## Acceptance status

| Surface | Status | Evidence / limitation |
| --- | --- | --- |
| Overview | Visual/semantic screenshot check PASS with minor issue | Correct 1 document, 2 scenes, 8/8 model checks; source/passage-specific work items; identity/hash footer awkward. Interactivity not fully exercised. |
| Scenes: 47 and 48 | Core source-link rendering PASS; authority comparison NOT YET VERIFIED | Scene 47 `wheeled dolly` and Scene 48 `rolling camera platform` both connect to permit restriction U002; 4 recorded source-check rows each; U003 and U004 quotations available in clause lists. |
| Documentary scope comparison | **PARTIAL — manual selection PASS, defaults fail** | Owner manually selected left S48 → U004 and right S47 → U003; both quotation panels updated correctly without changing scene labels. Automatic defaults are reversed and generic explanatory text repeats on both sides. No review committed. |
| Human review and Work | **PARTIAL — direct review save PASS; Work reconciliation/reload PENDING** | Scene **S48 / U01_PERMIT / U002** review saved with `Needs original source`; success banner shows **production version 2**, and a `Prior record` card displays the saved reviewer, decision and rationale. Need Work check and hard-refresh persistence; scene-specific documentary-claim form defaults still need correction. |
| Document intake / revisions / exports / recovery | PENDING | Not evaluated in this owner session. |

## Consolidated refinement candidates

| ID | Severity | Surface | Screenshot-grounded observation | Proposed correction to consider **after** acceptance | State |
| --- | --- | --- | --- | --- | --- |
| BR-01 | Medium | Overview evidence identity | Long hash competes horizontally with `Reload current production` in the ordinary overview. | Put technical identity behind disclosure or wrap/copy safely with button separate. | OPEN — cosmetic |
| BR-02 | **High UX** | Scenes → Next scene work | Generic old titles `S47/S48: model-positive claim without human documentary basis` appear, despite overview's improved exact-source label; inconsistent interpretations across surfaces. | Reuse passage-scoped, human-readable action presenter with exact task identity; do not rewrite historical records or merge tasks. | OPEN — cross-surface inconsistency |
| BR-03 | **High UX** | Scenes → Next scene work | `S47/S48: source finding awaits human review` repeats for separate clauses, with no visible passage IDs, passages or action differentiation. | Show clause `U001…U004`, short source quote, actual reason/status on each action row, preferably a compact grouped list; keep each task unique. | OPEN — ambiguity |
| BR-04 | Medium | Scenes → All source checks | Every clause has near-identical `Recorded Clocked example · older request contract · Open for review` summary, even though source and recorded judgments differ. | Distinguish relevance, proposed grant, and reviewer work without implying legal approval; make per-clause detail discoverable. | OPEN — discoverability |
| BR-05 | Medium | Scenes/Evidence | `older request contract` is internal implementation terminology, repeated on the main intelligence surface, and makes the fictional demo feel technical. | Replace prominent copy with readable provenance (e.g. `Owner-recorded Clocked finding · replayed, no new requests`), retain exact contract metadata in detail. | OPEN — copy / evidence safety |
| BR-06 | Medium | Scenes → source evidence | There is a long uninterrupted list of source checks followed by 7–8 action rows, creating substantial scroll distance; most actions look similar. | Preserve complete coverage, but prioritize key finding/current next action and make full audit a secondary disclosure; verify usability on mobile. | OPEN — information architecture |
| BR-07 | Low | Overview / top bar | Long fictional production name is still visually truncated in the production selector at this desktop width. | Consider tooltip/full display in selector without crowding top navigation; test at narrow widths first. | OPEN — cosmetic |
| BR-08 | **HIGH — confirmed UI/default mapping; manual override works** | Scenes → Compare documentary scope | From **S48** the comparison opens with left **S48 + U003**, although U003 explicitly authorizes **S47** conditionally; right **S47 + U004**, although U004 explicitly describes an **unissued request for S48**. The screenshot's two quotations are correct but default paired to the opposite scene. Source review of original `public/workspace/scene-view.mjs` at `bb5559a` shows default passage index derived from selected underlying task's passage plus `i` (left/right), not from each comparison scene's asserted scope. | Make default pairing **S48→U004** and **S47→U003** when these precise facts are supported by source, otherwise show a neutral/unselected or explicit user-verified comparison. Never infer authorization from reading selections. Ensure `Review this exact passage` cannot silently create scene↔passage claims from an automatically mismatched choice; preserve ability to manually select any passage for investigation. Add regression tests for both directional entry points and scene switches. | **CONFIRMED from screenshots + source default formula; fix in coordinated pass** |
| BR-09 | **MEDIUM-HIGH UX** | Documentary comparison → What remains to establish | Both columns repeat identical generic text, including “An unissued request does not establish an exception” beneath the signed Scene-47-only addendum and “Conditions still need human follow-through” beneath Scene-48's unsigned request. This obscures the key difference. | Present distinct **source-supported** next-human-check text: Scene 47: verify document issuance/authenticity, date/activity/scope and protective boards/registrar; Scene 48: request is explicitly unissued; obtain issued, scene-scoped amendment and verify remaining restrictions. Clearly identify this as a reading aid until human assessment. No automatic legal conclusion. | OPEN — evidenced by screenshot |


| BR-10 | **HIGH — unsafe/misleading form preset (no submitted claim shown)** | Work → Open work → scene-specific documentary-scope form | After opening the S47 U003 signed conditional addendum task, the selected scene/source/paragraph is correct, but `Human interpretation of passage` defaults to **`Restriction`**. The same default appears for S48 U001 (general location consent). Neither text is itself a restriction. `Claimed scope = Scope unresolved` is suitably conservative, but does not cure the incorrect type preset. | Start human interpretation with **unselected/needs explicit choice**, or source-aware suggestion clearly marked unverified. Require reviewer to choose and confirm against visible original quotation, and test U003/U001/U004/U002 independently. No silent claim submission. | **CONFIRMED misleading UI default; submission effect untested** |
| BR-11 | **MEDIUM-HIGH UX** | Work → Open work → Documentary scope | Exact scene, document and source passage are preselected, but destination opens at generic **Document roles and relationships** above the scene-specific form, requiring a long scroll past unrelated provenance and document linking. On the scene-specific form the left column contains selectors and then large unused whitespace, and the exact source passage is not quoted alongside the decision controls in screenshots. | Deep-link/focus to the exact task's scene-specific review; show its original quotation, document identity and task reason adjacent to form with an easy return-to-work path. Preserve the ability to review other documents without switching context. | **PARTIAL functional navigation PASS / focus defect evidenced** |
| BR-12 | **MEDIUM — potential invalid-default operation; backend result untested** | Documentary scope → Connect two documents | In one-document example, `Quoted original source = U01_PERMIT`, `Referenced document = U01_PERMIT`, and `Relationship claimed = Amends` are simultaneously prefilled. That presents a self-amendment as the apparent default, although the scenario's addendum/request are passages within a single stored document, not separately recorded document records. No relationship was submitted. | Suppress invalid self-relations or require explicit separate-document choices; explain when a mixed-content document calls for **passage-level scope** instead. Confirm server rejects invalid self-links. Do not invent distinct documents or auto-label quote claims as valid amendments. | **CONFIRMED risky form defaults; backend integrity not yet verified** |

| BR-13 | **HIGH — review source-target clarity** | Scene 48 → Record source review | The intended test was **Scene 48 / U004** (unissued request), but the review form instead displays **Scene 48 / U01_PERMIT / U002** (restriction on wheeled platforms), original offsets `[85,206]`. No source-selector is visible on this form. The U004 rationale must NOT be saved against U002. | Make entry links clause-specific, or let the reviewer switch the exact source in this form; highlight document/passage ID before saving. Check U004's own entry route before claiming it is broken. | **Owner intent vs opened task differs; valid S48/U002 source review saved successfully; U004 direct route still untested.** |

## 2026-10-26 — Documentary comparison owner evidence (3 screenshots)

- Entry route: owner on Scene **S48** clicked **Compare documentary scope**. The heading **“Different scenes. Exact documentary scope.”** and the selected underlying restriction **U002** are appropriate.
- Left comparison card: **S48** scene activity, **U003** signed addendum quoting **S47**. Right comparison card: **S47** scene activity, **U004** unissued request naming **S48**. Original quotes, provenance codepoint offsets and hashes visible, but the default association is backwards for the intended contrast.
- Both cards say **no human scene-scope assertion recorded**. In this version-1, zero-human-review evaluation workspace, that is coherent. No evidence a documentary claim was automatically authenticated or a filming clearance granted.
- Technical confirmation (read-only): in pinned source archive `BEFOREROLL_REFINEMENT_SOURCE_bb5559a.zip`, `public/workspace/scene-view.mjs` comparison column defaults to `baseIndex+i` relative to selected task source unit; the default does not pick a scene-scoped passage. Current refinement patch did not change this file.
- **Verdict:** Accurate underlying source text; **default comparison pairing fails coherent judge-eye interpretation** and could encourage wrong passage-to-scene review association if `Review this exact passage` is used. Do not save a human documentary-scope review from this default state.

## 2026-10-26 — Manual comparison and Work landing evidence (2 screenshots)

- On the documentary comparison, the owner manually changed the **left S48 card to U004** (unissued extension request) and the **right S47 card to U003** (signed conditional addendum). Both original quotations immediately updated and the card scene labels remained S48 and S47, respectively. **Manual selectors PASS.** This does **not** resolve BR-08: initial defaults still mispair scenes and passages.
- Returned to the **Work** register. On first visible rows, **Scene 47 · Check grant scope for passage U003** includes `Document U01_PERMIT · Passage U003`, and a signed-addendum excerpt; **Scene 48 · Check grant scope for passage U001** includes its own excerpt, and has an independent `Open work` link. Source identity and immediate prose are now distinguishable on these Work rows — **Work register rendering PASS**.
- Important distinction: generic repeated wording under **Scenes → Next scene work** still supports BR-02/BR-03. The current Work screenshot does **not** prove those problems apply in the Work register itself. Keep the defect scope narrow.
- **Not yet exercised:** clicking `Open work` from a specific item to confirm exact scene/document/passage target, draft preservation, review mutation and reload behavior. No human decisions were saved in this owner check.


## 2026-10-26 — Work item deep-link owner evidence (12 screenshots)

- Owner followed the two `Open work` routes into **Evidence → Documentary scope**. The scene-specific claim form preselected **S47 / U01_PERMIT / U003** for the Scene 47 conditional-addendum grant-scope work item and **S48 / U01_PERMIT / U001** for the Scene 48 location-consent scope work item. **Exact scene/document/passage target: PASS.**
- Screenshots show both as an **unsaved human assertion form** with reviewer, rationale, activity/location/date, claimed issue/scope, prerequisites and linkage controls. Counters still read **CLAIMS 0, CURRENT UNVERIFIED 0, STALE 0**, and document-role status reads **unreviewed 1**. No new human claim or source-linked relation was saved. **Submission, persistence and Work reconciliation remain UNTESTED.**
- The **human interpretation** dropdown preselects `Restriction` for the S47 U003 signed conditional addendum and S48 U001 general location consent. Those quotations are not restrictions. This is a high-priority incorrect default even though `Scope unresolved` and `Not established or unverified` remain conservative; see BR-10.
- `Connect two documents` presents U01_PERMIT-to-U01_PERMIT with relationship `Amends` by default in a one-document production. An invalid self-link has **not** been recorded or shown to be accepted. This is a dangerous selection affordance, not proof of a persisted data-integrity bug; see BR-12.
- Opening the work item does not land on or highlight the review form, instead presenting a broad document-role/relationship page. This interrupts a task-led workflow and obscures the original source while completing the form; see BR-11.
- Do **not** enter/save a default `Restriction` or self-`Amends` claim merely to test clicks. Next choose a separate, clearly labelled fictional human **source review** for a specific clause, then verify the saved review is reflected in Work and after reload. Freeze scope and screenshot evidence first; no Clocked API request needed.

## Verified **not** defects from these screenshots

- Scene 47 source passage U003 says a signed scene-scoped addendum allows the camera carriage **only while** boards and an on-site registrar are present; scene 48 passage U004 says the extension request **was not issued**. Both quotes are discoverable in scene source checks; their documentary relationship has **not yet been behaviorally tested**.
- The current evaluation copy shows version 1 and 0 human reviews. `No reviewed current documentary scope` is consistent with those data; source-document language alone is not human verification or filming authorization.
- Both Scenes 47 and 48 display restriction U002 and source-linked recorded model provenance. No claim that scores prove legal permission or real-world accuracy.
- Repeated source-review actions **may** be distinct clause/task IDs; do not deduplicate underlying data based on similar display strings.

## 2026-10-26 — Scene 48 source-review landing (1 screenshot)

- Owner used **Scenes → Scene 48 → Record source review** intending to test **U004**. The form instead clearly shows **U01_PERMIT / U002** (restriction requiring written registrar consent) for **Scene 48**, revision 1 and original offsets **[85, 206]**. The source quotation is correct for U002, not U004.
- The form presents `Your name`, `Decision = Needs original source`, `Rationale and next action`, `Stage this individual review` and `Save individual review`. There is no visible source selector. A U004-specific rationale would be attached to the wrong quotation if saved here. **No evidence a review was saved.**
- This is a task-targeting/discoverability defect candidate, **not evidence of a wrong-source database mutation**. We have not exercised a direct U004-specific task entry.

## 2026-10-26 — Scene 48 / U002 review save evidence (3 screenshots)

- On the human source-review page, the owner saved **S48 / U01_PERMIT / U002** with decision **`Needs original source`** and a rationale that identifies the source's written registrar-consent requirement and asks to obtain/verify the missing issued consent for this exact scene. This is a review of **U002**, not **U004**.
- The UI reports **`Saved against production version 2.`** This supports successful application-level write acknowledgement, following the prior production version 1.
- A **`Prior record`** card now displays decision `Needs original source`, reviewer **Fictional Evaluation Reviewer**, and the saved rationale about registrar consent. The supporting original passage and source offsets remain **U01_PERMIT / U002, revision 1, [85,206]**.
- The Clocked output still shows the previously recorded, source-bound **relevance 0.989 / granted_for_scene 0.0022**, with recorded-origin metadata. **No fresh provider call is indicated.** The old model score is not a legal conclusion and was not changed by this review.
- After save, the entry fields appear empty and ready for another review while the previous one is shown in `Prior record`. This is **not** on its own evidence of review loss; prior record is present.
- **Verdict:** Review submission and immediate readback **PASS**. Persistence after browser reload and downstream Work/dossier synchronization **NOT YET VERIFIED** from these three screenshots. No evidence of cross-clause mutation.

### BR-14 — Action/decision wording ambiguity (candidate, medium UX)

- The available decision is labelled **`Needs original source`**, yet this reviewed item already visibly has the complete original U002 passage and its offsets. The actual missing evidence is the **issued, activity/scene-specific written registrar consent** called for by U002. Choosing the nearest conservative status was sensible for this test, but unfamiliar judges may read it as saying U002 itself is missing.
- Consider a clear status **`Additional supporting evidence required`** / **`Condition not evidenced`**, with no silent migration of existing history; or scope-aware explanatory microcopy. Review actual current decision enumerations and downstream rules before changing anything. **Do not infer a persistence defect from wording alone.**

### BR-15 — Refresh loses current navigation (confirmed owner observation; high UX)

- **Reproduction:** While viewing **Scenes**, refresh the browser. The application returns to **Overview** rather than retaining **Scenes** and the selected scene. Owner reports this behavior on 2026-10-26; it has not yet been source-debugged or replicated in a separate browser.
- **Impact:** Breaks continuity during a source investigation and makes reload-based persistence verification more cumbersome. This is a navigation-state issue; **it does not by itself mean the saved human review or production evidence was lost**.
- **Coordinated correction:** Make primary workspace section and currently selected scene/record restorable on reload, preferably through explicit history-backed route/query state; support Back/Forward and shareable deep links in evaluation mode. Keep confidential document contents and credentials out of URLs. When a deep-linked record is missing or stale, show a safe explicit fallback. Do not silently submit or restore an unsaved review as a committed decision.
- **Follow-up acceptance:** From Scene 48/U002, refresh and verify that the same view/selection is restored; test Back/Forward, and direct open after restart. Separately verify recorded review persists after returning manually to U002 before the navigation fix.
- **Disposition:** **OPEN — owner-observed UX regression, planned for coordinated fix**.

## Next owner step

Return to **Work**, locate Scene 48's human follow-up/source-review item; verify the saved decision/reviewer/rationale is reflected there. Refresh once; because current navigation resets to Overview (BR-15), navigate back to the same S48/U002 review manually and confirm persistent readback. The previously identified U004 targeting and documentary scope default issues remain separate acceptance items. No new Clocked calls required.

## Coordinated correction policy

Do not make a patch during acceptance. Classify findings as confirmed bug, demonstrated usability defect, or optional polish. After the full owner session, inspect exact current source and ship one integrated correction; rerun automated checks and one focused browser regression. Never modify frozen Clocked evidence or retroactively rewrite review history.


## 2026-10-26 — Owner storage integrity and encrypted export

- Storage-health screenshot for fictional `eval_archive`: **PASS at UI level**. Application reports `Source custody and journals verified`, writer lock absent, execution lock absent, journals `VERIFIED`, missing originals `0`, no lock removal and no provider retries. The health command reports local storage/journal consistency **not** documentary authenticity.
- Exported backup supplied by owner: `BEFOREROLL_eval_archive_ENCRYPTED_OWNER_BACKUP.json`, 31,668 bytes, SHA-256 `e3b69b64af2a6d8ab430dde2e6a0ab38f129282849ebe636478f2fffbd1d7c79`. The JSON envelope parses and matches the app's `beforeroll-encrypted-owner-backup-v1` format: scrypt N=16384 r=8 p=1, 16-byte salt, AES-256-GCM with 12-byte IV/16-byte auth tag, 23,500-byte base64-decoded ciphertext; `workspaceId=eval_archive`, `containsSensitiveDocuments=true`, `notClearance=true`. **Envelope validation is not cryptographic verification/decryption**, which requires the owner-held passphrase.
- **RESTORE ACCEPTANCE=PENDING.** Current screenshot is fictional evaluation mode. In pinned source `bb5559a`, the `Recover a separate production` UI is intentionally hidden in evaluation mode. In private owner mode, verification and confirmed restoration target a separate recovery space; do not test into/overwrite the live evaluation store. Owner should confirm verified preview/inventory and separate-copy readback before marking PASS.

### BR-16 — Original custody download labels (LOW, polish)

- Both original-file links on Evidence → Exports & recovery use repeated visible text `Download exact original` plus byte size/hash, but not a filename.
- Coordinated polish: add original filename/role to each link (`U01_FICTIONAL_PERMIT.txt` and `U01_FICTIONAL_SCENES.txt`, or dynamic source-file names) without changing download bytes, access control, or SHA identities.
- **No fix deployed during acceptance.**

---

# v2 CONTINUATION — updated owner acceptance after the original register

**Authority:** The text above is the previously saved v1 acceptance register (BR-01 through BR-16), preserved verbatim. The additions below update observed acceptance states. Historical `PENDING` statements above are snapshots at their original observation time, not the current disposition where an explicit later update follows. **No UI fixes have been implemented by this document.**

## 2026-10-26 later owner acceptance: review → Work → History → export → recovery

- **Review persistence / Work reconciliation: PASS at owner-screen level.** After owner saved one **S48 / U01_PERMIT / U002** human source review (`Needs original source`, `Fictional Evaluation Reviewer`, rationale requiring written registrar consent), the Work register displayed a **`Scene 48: Follow up on passage U002`** action including the reviewer and full saved rationale. Other passage-specific action rows remained independently present; no evidence of U004 being overwritten.
- **Evidence History: PASS for immediate current readback.** Evidence → History showed **12 matching records / 12 total**, a current human review entry for S48, and an individual `Inspect` view rendering the exact **U01_PERMIT/U002** quote and rationale. The screen explicitly notes that the History page is not a complete history. This is not an assertion that all underlying journal items are shown.
- **Evidence exports: PASS at visible-screen level.** Evidence → Exports & recovery reported **8/8 current model checks, one human source review, zero historical human reviews**, original files available **2/2 byte-identical**, and outstanding reviews/dates/provenance work. Both JSON complete pack and human-readable Markdown report controls were visible. The screenshots do not prove that both resulting export files were opened and inspected.
- **Storage integrity: PASS, same as earlier.** Health action reported journals VERIFIED, missing originals zero, writer/execution lock absent, no provider retries. These are internal consistency checks, not permit authenticity.
- **Encrypted separate-copy recovery: PASS for owner-visible restore and immediate readback.** In a private owner-mode instance (different localhost port), the encrypted backup was selected and verified. Preview displayed production ID **`eval_archive`**, **8 source checks, one journal, two originals, zero missing**, and reported a complete backup. After entering the required exact production ID, the app displayed `Production recovered with original evidence and non-retryable billing history. No Clocked requests made.` The recovered copy appeared with **version 1**, **8/8 model checks** and **one human source review**. This is separate-copy recovery; it does not prove a cryptographically independent restore test outside the application.
- **Persistence versus selection distinguished.** After refreshing the private recovered workspace, the app temporarily displayed Overview with **`Choose a production`**, and clicking Scenes/Work/Evidence kept it there until the owner manually selected the recovered production using the chooser. The chooser listed the recovered production (two scenes, one document); after selection, the original 8/8 checks and one review reappeared and Evidence sources listed the original permit and call sheet. **Data were not shown to be lost.** See BR-17 for the session-selection continuity problem.
- **Scene revisit: PASS for review badge readback.** Later screenshot of recovered S48 source-check list displays U002 `Needs original source`, U001/U003/U004 still `Open for review` and intact original text. This corroborates the review remained attached to U002, not U004.

### BR-17 — Selected production lost on hard reload (HIGH UX; owner-confirmed)

- Distinct from BR-15 (selected section/scene resets). On private recovered-copy server, hard refresh returned to Overview with no production selected; navigation tabs then displayed Overview until the user opened **Choose a production** and reselected the recovered production.
- **Observed impact:** Appears like data loss/recovery failure, hides access to Scenes, Work and Evidence, and makes repeat review/recording cumbersome. **The owner successfully reselected the production and saw 8/8 source checks and one human review. The underlying evidence was NOT demonstrated missing.**
- **Coordinated correction candidate:** Keep selected production identity in safe reload-restorable navigation state while respecting owner token/session expiration and access mode. If unavailable, show a clear empty-selection/choose-production prompt when tabs are clicked, rather than silently staying on Overview. Test refresh, browser Back/Forward, restart, anonymous/new browser, recovered copy, expired token, missing/deleted production and same-named copies. Never put tokens or original source contents in URLs; do not silently fall back to an unrelated workspace.
- **Status:** OPEN; technical root cause not inspected. Treat BR-15 and BR-17 as related but separately reproducible acceptance cases.

### BR-18 — Recovery-copy/version labels could confuse original versus restored state (LOW/MEDIUM UX candidate)

- Original reviewed evaluation production showed **version 2** after the S48/U002 save. Separate restored copy showed **`Recovered copy / version 1`** while containing 8/8 source checks and one human review. A recovered copy having its own local version sequence can be legitimate; do not claim version regression or lost review.
- Consider an explanatory provenance cue tying recovered copy/version to the snapshot's original production/source identity, if supported by actual restore metadata and source history. Do not falsify source version or change any history to match a display expectation.
- **Status:** OPTIONAL POLISH / explanation; **NOT** a confirmed integrity defect.

## Updated owner-screen acceptance table

| Area | Latest observed state | Scope of evidence |
|---|---|---|
| Overview | PASS with BR-01 / BR-07 polish | No complete cold-user test |
| Scenes 47 / 48 | PASS source linkage; BR-02/03/04/05/06 still OPEN | U01 four units each |
| Comparison | Manual selectors PASS; BR-08 default pairing HIGH, BR-09 wording OPEN | No erroneous claim submitted |
| Documentary scope form | Exact deep links PASS; BR-10 wrong default HIGH; BR-11 landing; BR-12 self-link | No documentary claim submitted |
| Source review | S48/U002 save, previous-record readback PASS; BR-13 exact entry and BR-14 wording remain | S48/U004 direct link untested |
| Work | PASS saved S48/U002 follow-up and separate actions | Recovered/work state observed, not exhaustive |
| History | PASS saved current human entry and source quote | Complete journal not asserted |
| Exports | PASS on counters/originals/controls | Downloaded JSON/MD parsing not demonstrated |
| Internal health | PASS on journal consistency / missing originals 0 | Not documentary authenticity |
| Encrypted backup | Owner-visible verification and separate-copy restore PASS; zero new Clocked calls reported | Different private server, local owner passphrase stays private |
| Selection/navigation | BR-15 & BR-17 OPEN | Data still recoverable on manual selection |

## Coordinated fix gate (unchanged)

**Do not start the integrated UI patch until the sponsor-indispensability P0-B experiment and its immediate decision are reviewed.** The owner explicitly prioritizes proving Clocked's meaningful, reduced-human-effort contribution before cosmetic/navigation rework. Then implement confirmed high-severity UX/integrity issues in a single coordinated pass, preserving every owner source/review/journal and frozen Clocked result. Any candidate automation must remain model-suggested until justified by real evidence, and must not silently create filming authority. Run all automated regression tests and focused Windows browser acceptance, with a judge-eye pass across every primary section.
