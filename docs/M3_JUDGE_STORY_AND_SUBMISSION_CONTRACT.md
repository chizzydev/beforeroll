# BeforeRoll M3 — a judge-facing story that is evidence-gated

**Drafted before any live M3 Decide result.** The following is the intended storyboard, **not a verified outcome**. Make no correctness claim until owner evidence confirms it.

## Elevator pitch

**Know the constraint before the take.** An assistant director prepares a scene whose description does not use the same language as the film-location agreement. BeforeRoll uses **Clocked Decide** to relate the proposed activity to a selected source clause and **Clocked Extract** to read conventional permit limits with exact quotations. Its timeline, reviewer and dossier turn those judgments into a practical, auditable preflight — without pretending the model issues permission.

## 45-second judge tour (only after LIVE M3A owner gate)

- 0–10 s: **The trap.** BeforeRoll's deterministic dayline can compare 17:20 with 17:00. But the location agreement describes *manufactured vapor* while Scene 31 says *solid carbon dioxide pellets turning into gas*. Basic time arithmetic and row parsing cannot establish the connection.
- 10–24 s: **Show Clocked, not a mock.** Open Semantic lens on fictional M3A, show amber **NO SEMANTIC LINK / NOT EVALUATED** before running. Click live Clocked Decide exactly once. Inspect real returned `noul` probabilities for activity relevance and specific issued permission. If inconclusive, say inconclusive.
- 24–34 s: **Operational consequence.** If relevance is supported, highlight the exact permit clause and source scene row and display **HUMAN REVIEW** for missing countersigned authorization. Point to the request fingerprint and reported credits. The same UI admits model uncertainty and cannot infer legal clearance.
- 34–41 s: **Adversarial contrast.** Demonstrate M3B *only if live measured*: a signed-scene variation may change the authorization reading, but floor mats and supervision still require a human. A pyrotechnics-only clause should not automatically trigger a vapor warning.
- 41–45 s: **Graceful failure.** Turn Clocked off: basic timetable works, but the semantic result is *not available*; no hardcoded vapor-synonym fallback. Export the actual Decide JSON and a review dossier.

## Sponsor integration truth table

| Endpoint | Built role | Proven by this release? |
| --- | --- | --- |
| Extract | Existing M2 owner-recorded issued-permit reading with exact source offsets; live server route implemented | R7 owner-run API response and M2 mocked transport; **app live owner gate open** |
| Decide | **New M3** scene-to-selected-clause `noul` relevance and specific-issued-grant probabilities | Correct payload verified against public SDK example; mocked transport test; **real owner-run call open** |
| Fill | None. Avoid decorative endpoint count. | Not implemented, not claimed |

## Required evidence for final submission

Actual owner M3A API JSON, M3B counterfactual, M3N negative control, independent paraphrase beyond these author-designed examples, readable scene-conditioned source citations, direct Windows UI capture, real application Clocked call (not only a runner), public deployment with credit-protected demo, robust input validation, video, README and contest write-up. A genuine product must address clause discovery without a human choosing one clause; **M3-S1 is the narrower link proof**, not full automated discovery.

## Claims to never make

"Certified", "automatically cleared", "the permit is genuine", "the model always understands amendments", "we benchmarked real film permits", "three endpoints integrated", "Clocked analyzed scenes in R8", or "M3 live passes" before the receipt exists.
