# BeforeRoll M2 — Owner evidence readout and engineering gate

**Date:** 24 October 2026 (WAT)  
**Scope:** Review of M1 owner-supplied Windows GUI screenshots + owner-exported F01 Markdown dossier, followed by code-level remediation.  
**Verdict:** M1 workflow **substantially verified with two documented defects**. M2 fixes written and automated-test validated; **M2 Windows acceptance pending**. Live app-to-Clocked route **not yet owner-tested**.

## Evidenced in M1 screenshots and dossier

- Scene 16 selected with WEST PLAZA and drone activity. Findings for location outside issued scope and drone unauthorized visibly present. Source quotations for each warning not independently shown in owner screenshots; do not claim that click-path fully accepted.
- Variation V-9: Scene 23 shows 20:10–20:45 on an unclipped evening timeline; warning says scoped variation cannot be applied automatically, plus 20:45 exceeds 20:30 candidate end. Scene 22 WAREHOUSE SOUTH appears with REVIEW; separate detailed inspection of Scene 22 not proven.
- Clicking MARK REVIEWED changed to UNMARK REVIEWED, and Scene 15 sign-off remains an acknowledged unresolved finding. The exported F01 dossier states sign-off **ACKNOWLEDGED, NOT CLEARED** and preserves both Scene 15 timing and amplified sound mismatches as **OPEN** with source offsets.
- Changing Scene 15 end from 17:20 to 16:10 updated both timeline and row; HUMAN-EDITED and independent sign-off visible; previous overrun warnings no longer shown. Unexpected **Amplified playback authorization unknown** also appeared although original 16:15 sound cutoff was source-verified. This is an M1 logic defect, not a fresh permissions issue.
- Editing permit source and pressing APPLY TEXT / CLEAR OLD EXTRACT invalidated earlier Clocked readings; issued fields became unknown, flags became unresolved review questions, and no credible issued cutoff was displayed. Owner restoration not established from provided evidence.
- The inspector's hardcoded SOURCE-LINKED badge appeared while the selected coordinator sign-off explicitly lacked a trustworthy issued-source citation. This is a misleading provenance representation.

## M2 fixes

**SOUND_known-valid:** An amplified scene ending on or before the verified cutoff does not receive SOUND_UNKNOWN. Scenes after cutoff still get SOUND. Null/unverifiable cutoff still gets SOUND_UNKNOWN. The human-edited row remains an independent sign-off task.

**EVIDENCE_BADGE:** Dynamic classification: PERMIT + SCENE LINKED, SCENE SOURCE ONLY, PERMIT CITED ONLY, CITATION UNVERIFIED or NO ACTIVE FINDING. Text and Markdown export distinguish missing permit evidence from an actual issued-source citation.

**LOCAL LIVE-TRANSPORT CONTRACT:** Unit-level mocked `POST /clocked/extract` request path with secret-gated authentication and credit reporting, using no live key/provider call. External live integration acceptance remains pending.

## M2 owner acceptance (single bounded replay session)

1. Run `npm test` and confirm 29/29 (all offline; zero API credits). Start the new M2 app in recorded mode.
2. Scene 15 -> select **Call-sheet coordinator sign-off is pending**: evidence badge must say **SCENE SOURCE ONLY**, not SOURCE-LINKED. Select **Filming exceeds documented 17:00 cutoff**: evidence badge must say **PERMIT + SCENE LINKED** with original `17:00` source quote.
3. Source intake -> under **Correct current scene values**, edit Scene 15 ending time to `16:10` and APPLY MANUAL CORRECTION. Its timing and amplified sound mismatches must disappear; **Amplified playback authorization unknown must not appear**. HUMAN-EDITED and corrected-scene sign-off must remain. This is *not filming clearance*.
4. Return to Source intake -> **LOAD FP-1042**, then select Scene 15 sign-off and MARK REVIEWED; export dossier. Confirm report includes `Evidence class: SCENE SOURCE ONLY` for coordinator sign-off, `Evidence class: PERMIT + SCENE LINKED` for timing and sound issues, sign-off **ACKNOWLEDGED, NOT CLEARED**, and timing and sound issues **OPEN**.

Stop on a failing step; leave previous M1 files unchanged.

## Still open (not waived)

- Owner-run **real Clocked Extract through BeforeRoll server**: single synthetic source, local masked key, separate operator token, and credit balance check. No automatic retries; never send real documents in this prototype. Verification must include field values, anchor provenance, HTTP error behavior and no key leakage.
- Harder blind permit source samples and direct deterministic baseline; official-rule/competitor recheck before commitment; evaluate real film operations value.
- Import/edit lifecycle for authentic call-sheet formats, multiple document authority/precedence model, timezone/overnight, better accessibility, persistent packets/auth, deployment, stronger README/write-up/video. These must be tracked and built deliberately, not silently removed.
