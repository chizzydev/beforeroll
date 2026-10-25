# BeforeRoll M3 — Three-way independent owner-evidence audit v1.0

Date: 24 October 2026. Audited M3A, M3N and M3B using the owner-exported `BEFOREROLL_M3_LIVE_DECIDE_*.json` files, the pinned M3-S1 v0.2.0 production `decideSemanticPayload`, `conservativeSemanticFinding`, original fictional scene/permit packets, and the **pre-live** frozen M3 gold. The included `verify_m3_owner_evidence.mjs` reproduces the checks entirely offline.

## Result — all three preregistered narrow cases PASS

| Case | Activity-link `noul` | Documented-grant `noul` | Recomputed application classification | Narrow gold | Outcome |
|---|---:|---:|---|---|---|
| M3A: unfamiliar CO2/vapor prerequisite | 0.9914 | 0.0019 | `CLOCKED_SEMANTIC_REVIEW` | relevant; no grant | PASS |
| M3N: sculpture versus pyrotechnics | 0.0048 | 0.0022 | `NO_SEMANTIC_LINK_DETECTED` | unrelated; no grant | PASS |
| M3B: signed scene-specific variation | 0.9908 | 0.9854 | `CLOCKED_CONDITIONAL_AUTHORITY_REVIEW` | relevant; documentary grant; safety review outstanding | PASS |

The 0.8 / 0.2 decision thresholds are from the pinned application, not adjusted after seeing outputs. Each exported request reported **1 credit**; total **3 observed credits**. The auditor issued **zero additional API calls**.

## Reproducibility and evidence integrity

For each case, PASS means all of the following: the case ID matches, full permit and scene SHA-256 match frozen input, exported complete scene row matches, selected clause equals the original source substring at the stated **Unicode code-point** positions, the request fingerprint equals the actual pinned JavaScript `decideSemanticPayload` serialized via `JSON.stringify`, both `noul` model answers are typed finite probabilities within [0,1], `conservativeSemanticFinding` reproduces the exported finding **exactly**, frozen gold direction matches, and output remains review/unresolved rather than legal clearance. Machine details are in `M3_TRIAD_MACHINE_AUDIT.json`.

Specific provenance: M3N clause `[50,216)`; M3B variation `[146,370)`. All three records are internally consistent with the exact pinned app and original fictional inputs.

## Critical limits — do not overclaim

1. These are **three intentionally designed synthetic pairs**, not a blinded operational benchmark or estimate of accuracy. M3N states explicitly that no combustion or special effects are planned; a difficult disguised negative control remains untested.
2. All clauses were **human-selected**. The model did not discover the correct clause from a whole permit. Successful M3A/M3B relevance supports narrowly scoped semantic interpretation, not automatic full-document discovery.
3. M3B assesses whether a document **states a conditional authorization**, not whether its purported signature is authentic, its 5 November date matches an independently validated scene date, or its floor-mat and steward requirements were actually met. All must remain **human review**. A document claiming authority is not proof of genuine authority.
4. M3N only establishes **no detected connection to the selected pyrotechnic clause**. It never establishes general freedom to film.
5. `noul` values are **model scores**, not calibrated empirical error probabilities. Do not market '99% accuracy' based on them.
6. Evidence exports contain selected answer objects, **not the complete provider response or signed billing/authenticity attestation**. The audit proves reproducibility and internal consistency, not cryptographic provider origin.
7. The current M3-S1 UI includes manually selected candidate text and is **not yet an end-to-end automatic permit/scene review**. R8 separately showed omissions in a one-pass Extract design; those failures remain.

## Binding engineering conclusion

`M3_S1_THREE_WAY_OWNER_GATE=PASS_NARROW_SYNTHETIC_SEMANTIC_TRIAD`.

Advance to **M3-S2 Clocked Condition Sweep**, a bounded application-level implementation of automatic *semantic ranking of every detected candidate clause against one scene*. Deterministic clause segmentation is not semantic interpretation; Clocked Decide owns per-clause applicability and grant reading. For scope transparency, this **does not** guarantee every operative multi-sentence or atypically formatted condition was segmented, and pairwise judgments **do not resolve amendment precedence**.

Production gate still OPEN: real app-level M3-S2 owner request against unselected full permit, an independent unfamiliar hard paraphrase + negative, false-positive and missed-condition audit, complete paperwork / README / sponsor-rubric narrative, and deployment readiness. No automatic filming clearance is authorized.
