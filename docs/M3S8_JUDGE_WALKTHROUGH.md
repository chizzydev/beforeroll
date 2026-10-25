# BeforeRoll — M3-S8 Judge Walkthrough & Submission Evidence

## The user problem
A location coordinator has permission documents and a shooting schedule. Standard timetable software can compare dates, locations and clock times but cannot reliably infer whether unfamiliar activity descriptions implicate a specific written location condition, or distinguish a general location consent from a scene-specific variation.

## Reviewer cold start — no API key and no payments
1. Install Node.js 20+. Run `npm test`, then `node server.mjs` in this directory and visit http://127.0.0.1:3000. This starts strictly offline.
2. In Review Desk choose `LOAD FROZEN U01 / ARCHIVE FLOOR`. Observe 2 scenes NOT AI-EVALUATED, with an **AI-OFF BASELINE** that does NOT supply synthetic model answers.
3. Choose `REPLAY VERIFIED U01 / REAL CLOCKED RECORDING`. Watch 0/2 → 2/2 for segmented clauses. Check source-backed restriction on wheeled platforms, Scene 47's narrowly named addendum and Scene 48's `CONDITION_REVIEW_NO_GRANT`. Grant to Scene 47 is *not* transferred to Scene 48.
4. Choose `LOAD FROZEN U02 / PUBLIC EGRESS`: all model findings clear. Then `REPLAY VERIFIED U02 / REAL CLOCKED RECORDING`. Scene 62 receives a candidate scene-specific approved route plan; Scene 63 remains `CONDITION_REVIEW_NO_GRANT` because the written request to relocate the stall was never issued as an amendment.
5. Inspect the **ADDITIONAL CLAUSES / SCOPE QUESTIONS** panel: broad site consent carries a model-positive grant score but **is not** used to override egress restrictions. Inspect linked original source excerpts, offsets and the distinct request hashes.
6. Export the dossier, confirm `OWNER-RECORDED` execution provenance. To inspect the underlying real owner submissions without a network call, see the original JSON in `fixtures/audit/`.

## What is actual sponsor integration?
Real Clocked Decide outputs are stored as typed scores for relevance of each scene and selected clause, and documentary-grant confidence. Source segmentation, input fingerprints, source-offset binding and preflight scheduling are deterministic. Clocked model judgments change which source clauses and documentary variations the application flags for human inspection. This is not a search-and-replace synonym table.

## Evidence
- U01: original 8/8 reported-credited requests, 5/5 preregistered assertions (narrow synthetic pass).
- U02: original 8/8 reported-credited requests, 5/5 preregistered assertions (narrow synthetic pass).
- Both data files remain original and are revalidated on replay using scene/permit hashes and per-request fingerprints. Provider authenticity cannot be cryptographically proven from JSON alone.
- U03: offline-only omitted-short-clause sentinel guards against false exhaustive-comprehension claims.

## Limitations and claims NOT made
Synthetic experiments are *not* real-world accuracy, validated legal authority or a substitute for issuing-office checks. No automatic filming clearance. A named scene-specific clause may still be insufficient for the activity unless its prerequisites are satisfied. Sentence segmentation is incomplete on complex documents. Public-facing live API operation is NOT safe without further authentication and abuse protections.

## Submission work still required
Public no-key recorded-only deployment; accessible public repo; screenshots and video; form fields and project ownership information; independent remote browser review. Do not submit this as already deployed or as a production-ready permit tool.
