# BeforeRoll M3-S1 — One working semantic-link slice (implementation contract)

**Status: authorized to implement. Not yet built or live-tested.** Written from R8 C01-C08 independent audit, 24 October 2026. Scope: one permitted document and one scene with a high-value unfamiliar restriction, with citations, uncertainty and contrastive authority.

## Product behavior, not endpoint-count theater

**Owner story:** "My schedule says we will spray a practical fine haze for a scene, but the permit calls it an aerosol particulate effect. Which conditions need review before that shot?" Clocked should make the *connection*; BeforeRoll should show two inspectable quotes and what needs attention. A different properly scoped signed approval should update the review state but must not mark the shoot 'legal' or 'cleared'.

## Data contract

`Document`: document_id, original_source_hash, full_text, source_type (issued/variation/application/unknown), source_status_review (human-verified/unverified), date/location, trusted_source_origin flag. Instrument authenticity is outside product capabilities.

`ClauseCandidate`: clause_id, document_id, full_contiguous_source_span (start/end/codepoints), action_category (prohibition/prerequisite/permission/unknown), action and affected activity wording, effective date/time, scene/location scope, prerequisites, linked parent clause if an exception. All items with incomplete operands are `needs_context=true`.

`Scene`: scene_id, description, original complete row/paragraph source range, normalized date/time/location if available, manual-edited marker.

`SemanticLink`: scene_id, clause_id, model-generated applicability (`applies`/`not_applies`/`uncertain`), model rationale, model identifier/provider endpoint, input hash, timestamps, two raw quotes, confidence/probability if present, source-validation outcomes. **Do not automatically turn `applies` into 'violation'; determination is constrained by source authority and outstanding prerequisite checks.**

`Finding`: type (`documented_mismatch`/`conditional_authorization_review`/`incomplete_clause_review`/`unknown_permission_review`), evidence and linked provenance, current human-ack state, approval statement always `not a clearance`.

## Integration boundaries

- Clocked Extract makes full-source clause candidates. Do not drop original text after extraction; outputs can omit decisive rules.
- Clocked Fill *if its actual schema and one-run evaluation validates incremental value* extracts or interprets free-form scene meaning. Label inferred values as interpretation, not source text; for verbatim fields set `infer=false`.
- Clocked Decide *if an actual per-document, one-packet API test demonstrates value* handles a scoped semantic link or explicit-authorization question. Its `noul` question type is an API spelling detail, not a truth guarantee. Pair scene and clause as one labeled packet if needed; document scope and context are explicit. Do not use Pipeline expecting step-to-step data forwarding (Pipeline steps run independently over one input).
- Deterministic code validates both citations, computes exact time math and applies vetoes; it may not silently generate a semantic link when Clocked is off.
- Human decides if the source is genuinely issued/signed and whether obligations are operationally met.

## Single killer demo

1. Open a scene with a fog/PA or unfamiliar restriction expressed in other language; show existing timeline no hardcoded hazard insight.
2. Run actual Clocked semantic analysis with one measured request; selected permit condition and intended scene phrase become highlighted together.
3. Show reviewer action `REVIEW: specific written authorization required, not provided` or `CONDITIONALLY AUTHORIZED BY SOURCE: safety supervision to verify` with *no* legal-clearance claim.
4. Apply a different signed, scene-scoped variation and show only the relevant scene relationship change.
5. Turn Clocked off and show normal schedule arithmetic still works but novel semantic insight is absent/unresolved. Export dossier and show actual citations.

## Stop/go and safety

Before submitting, prove against at least one independent unseen paraphrase and one no-warning counterfactual; no case-ID branch tables. Evidence needs both correct source anchors and actual applicability. Explicit unknowns must not be scored as permissions. One failed bounded semantic test permits one design correction, **not** endless prompt tuning or visual polish. Existing M2 Windows behavior and offline tests must not regress; add M3 focused tests plus live-owner smoke. The README, click-by-click guide, sample input, and 45-second judge narrative must be updated in the same increment.
