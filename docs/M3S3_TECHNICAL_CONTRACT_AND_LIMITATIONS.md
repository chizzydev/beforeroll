# M3-S3 contract — Clocked source-bound findings in the actual Review Desk

## Data flow
1. The original permit text and one complete unchanged scene row are the source authority *inputs*, not an assertion of legal authority.
2. Locally, deterministic `sentenceCandidates()` enumerates 25–1800-character punctuation-separated passages, with a hard 1–8 candidate limit for the sweep. Missing fragments are a known limitation.
3. Operator authorizes up to 8 sequential, individually billable `POST /clocked/decide` calls; the two **noul** questions assess activity relevance and whether this clause describes a particular documentary grant. No automatic retries and no pretend decisions in offline mode.
4. `auditDeskSweep()` verifies *both* source SHA-256 hashes, exact codepoint ranges, unchanged scene text, candidate identity/count, reported answer shape, classification/relevance/grant consistency, completeness status, absence of misleading clearance, and uncovered-source-fragment disclosures.
5. Only positive/ambiguous model judgments become additional `severity=review` findings on the main scene's Review Desk; low relevance clauses remain observable in the score chips and dossier. No Clocked result ever yields `clear` or `authorized`.
6. Source evidence in the Evidence Inspector links the exact permit quotation to the original scene row, annotated as live vs owner-recorded model evidence. `MARK REVIEWED` is acknowledgement, never removal.
7. Markdown dossier includes all four clause assessments and relevant scene-specific findings, exact source quotations, request hashes, credit values and warnings. Source/call-sheet edits or human corrections invalidate bound Clocked findings.

## Competition evidence and provenance
The portable `fixtures/M3S2_OWNER_M3B_SWEEP_RECORDED.json` originated with the owner's real 24 October 2026 Clocked Decide Condition Sweep; 4 calls, 4 credits as reported by the provider headers. It is *not a fresh call and not a synthetic model output*. The permit and scene remain fictional. The same model response also had one ambiguous 49.96% clause and a no-link heading, retained, not optimized away.

## Explicit nonclaims
Not complete clause discovery; not real-film-permit accuracy; not cryptographic provider attestation; not legal authority or permit-authenticity verification; not resolution of supersession across documents; not safety-prerequisite fulfillment; not general raw-PDF/OCR support; not multi-user/cloud ready. A model probability is a judgment, not evidence of truth or calibrated confidence. The 8-clause bound and 12-attempt/hour limit require carefully scoped demonstrations; they are not a production-capacity guarantee. Separate existing M3-S2 Semantic Lens remains for provenance, but the new main Review Desk is the score-facing workflow.

## Safeguards/tests
Previous 47 Node tests preserved; eight new tests cover proper binding, stale source, tampered scores/ranges, duplicates, incomplete scans and no-clearance mapping (55/55 Node tests passed). HTTP routes and syntax checks completed. Windows browser GUI and fresh live M3-S3 scene scanning remain owner acceptance. Local Chromium was blocked by this environment's browser administrator policy; no M3-S3 browser screenshot is claimed as verified. M1 Windows screenshot already accepted the timeline CSP fix in an earlier release.
