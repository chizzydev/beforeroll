> **M3 UPDATE:** This document is the historical M2 replay tour. For the new Clocked Decide semantic-link storyline (not yet real-provider-accepted), see [M3 judge-facing storyboard](M3_JUDGE_STORY_AND_SUBMISSION_CONTRACT.md).

# BeforeRoll — Day-one judge tour and honest submission copy

**Working draft, October 24, 2026.** This is a production artifact outline written alongside runnable code; no deployment or final submission is claimed.

## User story

A second assistant director or location manager preparing tomorrow's shoot receives a location permit and a draft call sheet. They need to know whether the schedule *appears to conflict with the supplied written conditions* and which unresolved questions must be escalated before camera call. Today this comparison is often handled through paper and ad hoc messaging. BeforeRoll puts the underlying quote beside the scene being discussed, instead of offering an unsupported “compliant” score.

## Judge walkthrough (90 seconds, runnable in replay)

**00:00–00:12 — Stakes.** Open the app at `http://127.0.0.1:3000`. Introduce the production coordinator, tomorrow's synthetic East Courtyard shoot and the large banner: **DRAFT REVIEW — NOT FILMING CLEARANCE**.

**00:12–00:34 — Sponsor relevance.** Open **Source intake**. Show a genuine owner-recorded Clocked Extract `F01` response converted into issued permit fields. The issued film cutoff is **17:00** while the application annex merely *requested* **20:00**. Click the field source, then the original permit. Stress: this is a source-based reading; the model did not grant permission.

**00:34–00:57 — Visual pay-off.** Return to **Review desk**; click **Scene 15**. Its **17:20** finish crosses **17:00**; amplified playback crosses **16:15**. The dayline highlights the crossing, and the evidence panel shows the exact permit substring and the original scene row. Toggle full permit and call sheet. Clocked read the permit; the app performed arithmetic and format-safe scene parsing.

**00:57–01:09 — Adverse control.** Click **Scene 16**. The issued text excludes West Plaza and expressly does **not** authorize drone operation. The original application asked for a drone, but that's not permission.

**01:09–01:21 — Failure-aware differentiator.** Source intake → **LOAD VARIATION V-9**. The R7 API did extract the signed 20:30 deadline, but mis-sourced the amendment location/date to the base paragraph. BeforeRoll catches the provenance issue and raises human review rather than automatically approving Warehouse North or South. A pending SOUTH 22:00 email is never accepted as signed authority.

**01:21–01:30 — Owner outcome.** Acknowledge a finding, make a human correction, and export a Markdown dossier. Explicitly state that acknowledgement is **not** a clearance. The project README already describes how to reproduce all these steps.

## Exact sponsor integration claim (for future write-up)

- Endpoint: **Clocked Extract**: `POST /clocked/extract`, with `text`, a curated `fields` dictionary and instructions separating issued authority from proposals.
- Credential: server environment only; browser receives no Clocked key. Operator gate prevents anonymous demo visitors from triggering paid requests.
- Recorded evidence: **F01 5 credits**, **F02 5 credits**, and the deliberately rejected row-list architecture **F03 10 credits** from the owner-run R7 round, **20 credits total**; Oct 24, 2026. Replay spends zero credits.
- Genuine value: extracting permission-specific semantic facts from document prose (which rule is issued, which is merely requested) together with source spans, not creating compliance verdicts through AI.
- Genuine limitation: F02 semantic values were right but some source offsets were linked to the wrong authority paragraph. F03 cross-row extraction failed. Application prevents these failure classes from silently granting permission.
- Not supported by evidence: 100% reliability, production clearance, legal compliance, working OCR/PDF, full multi-file legal supersession, permit authenticity, institutional adoption, substantial reduction in crew losses, deployed status, or superiority over established film production software.

## Rubric traceability / no fabricated breadth

| Challenge score concern | Real click or code evidence now | Required later |
|---|---|---|
| Practical value | Scene-to-permit conflict with explicit human reviewer, exported dossier | Outside-professional evaluation / credible user interviews |
| Core sponsor integration | Genuine R7 recorded Extract replay; server live handler; quote positions | Owner-run live handler acceptance; harder authentic-style novel inputs vs deterministic baseline |
| Additional endpoints | **None claimed.** F03 failure intentionally removed from production flow | Add only if independently demonstrated to improve a distinct workflow |
| Implementation & UX | Premium responsive review desk, timeline, evidence quote, editing, API gating | Accessibility pass, more imports, document parser, persistence, actual deployed link |
| Explanation & reproducibility | README, tests, screenshots, this 90-sec script, generated fixtures and cost disclosure | Recorded demo video, public repo, final source provenance and deployment proof |
| Extract family depth | Wrong-authority decoy, typed null, exact codepoint offsets, F02 provenance defect, F03 row failure | Additional blind source types and evaluated extraction contracts |

## Submission write-up outline (not finished public entry)

**Problem:** Production documents distribute permissions, exceptions, schedules and requests across separate pages. A proposed scene can look ordinary until compared against the exact words of the issued location authorization.

**Approach:** BeforeRoll uses Clocked Extract for unstructured **permit** language, then applies transparent local checks against specifically parsed draft scenes. Each potential mismatch carries both a permit quote and the original schedule row, and unresolved questions never silently become permission.

**Why Clocked:** The valuable part of the API is differentiating *what the issued authorization actually states* from a nearby unapproved proposal. We measured F01/F02 on hand-authored synthetic inputs and explicitly expose their limits. The sponsor is not used for basic arithmetic or to give final legal conclusions.

**Trust:** Every quoted field requires a matching source span. A signed variation also needs evidence linked to its own authority paragraph. All self-corrections are visibly uncited and demand further review.

**Test & reproduce:** Run `npm test`, then start with the PowerShell helper. No key/credits required for reproducible recorded-mode demonstration. Optional credit-consuming live mode is separate and gated.

**What is next:** Expand parsing, do independent realistic tests, implement an actual judge-clickable deployed version and only then decide on the strongest official category and claim.
