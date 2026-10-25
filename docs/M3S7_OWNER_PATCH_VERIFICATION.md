# BeforeRoll M3-S7 — Owner-requested hotfix and scientific preservation

**Scope:** application-side hourly throttle and false conditional variation presentation. No new live Clocked requests used in this patch, and no changes to frozen U01/U02/U03 source inputs, assertion thresholds, model-answer JSON, or read-only scorer semantics.

## Identified defect
U01 Scene 48 had a positive model **general location consent** (`granted_for_scene = 0.8159` for Clause 1) and an applicable **camera platform restriction** (Clause 2 relevance 0.989). The old summary treated these as `RESTRICTION_AND_CONDITIONAL_GRANT` and presented location consent as a potential *exception to the restriction*. The source text of Clause 1 does not specifically authorize restricted platform activity.

## Fixed interpretation fence
The source-bound audit and raw Clocked labels remain unmodified. Presentation promotes a positive model-grant candidate into a potential *scene-scoped variation* slot only when the candidate excerpt unambiguously names the current scene number and no different scene number. Otherwise it is displayed as `MODEL_GRANT_SCOPE_UNVERIFIED` with the original score, exact quote, clause index, and request hash, and is NOT used as evidence overriding an activity restriction. This is deliberately conservative and may withhold valid general grants pending human review; it cannot prove authenticity, operative authority, or correct scope. This fence is source-identity scoped, NOT an activity synonym map or an assertion that `Scene X` wording proves authorization.

Expected original U01 source-bound dashboard interpretations: Scene 47 = `RESTRICTION_AND_CONDITIONAL_GRANT` (explicitly names Scene 47); Scene 48 = `CONDITION_REVIEW_NO_GRANT` (Clause 1 general consent retained as unresolved scope; Scene 47 addendum not inherited). No scene receives filming clearance.

## Throttle fix
`BEFOREROLL_MAX_CALLS_PER_HOUR` local default increased from 12 to 256. Owner may override with integer 8–20000. Provider quotas are separate; not verified. Operator authentication, 8-call per-two-scene cap, fail-closed response validation, source hashes, timeout handling and no-auto-retry behavior remain. Previous mock server integration tests plus added consecutive eight-call batches verify that 16 sequential calls are not stopped by the local throttle, without external network use.

## Owner data
The uploaded U01 JSON is embedded **byte-for-byte** at `fixtures/audit/M3S6_U01_OWNER_LIVE_EVIDENCE.json`. Independent preregistered evaluation: 5/5 (narrow synthetic pass); no provider-origin cryptographic attestation claimed. The original dataset/preregistration and scoring program are unchanged. U02 actual model accuracy remains untested pending owner execution.

## Deployability
The local app remains a synthetic research prototype. Live operator token and key must never be deployed publicly; use recorded-only hosting after its separate verification. Public README/judge-writeup delivery remains an open submission workstream.
