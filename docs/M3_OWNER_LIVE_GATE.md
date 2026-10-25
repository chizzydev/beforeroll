# M3-S1 owner gate — the Clocked-only semantic insight

**24 October 2026. Engineering candidate, not independently provider-accepted.**

## One bounded owner session

1. On Windows, close older BeforeRoll server (Ctrl+C). `npm test` must report 40/40 PASS.
2. Start `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1 -Live`. Enter your *Clocked API key* only into its locally masked terminal prompt. It is **not** shown in the browser and is **not** saved in a file. Copy the **separate LIVE_OPERATOR_TOKEN** into the Semantic Lens's operator-token input. Avoid screenshots containing that token.
3. Visit `http://127.0.0.1:3000` → **Semantic lens** → **UNSEEN VAPOR PARAPHRASE / M3A**. The permit's longest clause (the airborne-particulate / manufactured-vapor condition) should already be selected. If not, choose it manually; the selection is *not* model inference. Scene 31 uses *pellets of solid carbon dioxide* without restating the permit's vocabulary. Note the amber **NO SEMANTIC LINK / NOT EVALUATED** baseline.
4. Click **RUN CLOCKED SEMANTIC LINK** and accept the credit warning **once**. This is one actual server-mediated `POST /clocked/decide` request containing the exact selected clause and the original scene row. It asks two independent `noul` questions (activity relevance and whether the same clause explicitly grants permission). No retries. Do **not** interpret HTTP 200 or high probability as legal permission.
5. Inspect actual Clocked probabilities and status. If relevance is at least 0.80, grant at most 0.20, expect `CLOCKED_SEMANTIC_REVIEW`. Otherwise report the actual classification without modifying thresholds. The result must display both verbatim texts and the request SHA-256. Click **EXPORT ORIGINAL CLOCKED SEMANTIC EVIDENCE (JSON)**. Review the downloaded file; it excludes key and token. Attach that JSON to ChatGPT for an independent audit.
6. Optional separate, *additional credit-consuming* contrast: choose **SIGNED CONTRAST / M3B** and inspect the signed, scene-scoped conditional variation. Even a model-grant result remains REVIEW, not clearance. **UNRELATED CONTROL / M3N** tests the other direction. Each case is a new billable API request; run only if M3A response is valid and you choose to spend credits.
7. Stop server Ctrl+C. Relaunch **without `-Live`**. The Semantic lens must display **NO SEMANTIC LINK / NOT EVALUATED**, not a fabricated positive result. Older F01 review desk/Source intake behavior must still work. Replay has no billable model analysis.

## Frozen evaluation before any response

- M3A (primary novelty): full source clause says airborne particulates / manufactured vapor need countersigned authorization; scene describes solid carbon-dioxide pellets releasing gas. Gold: **related operational condition; issued authorization not shown; HUMAN REVIEW.** This is author-created synthetic gold, not a professional permit standard.
- M3B (contrast): signed variation describes frozen-CO2 clouds permitted for the same scene, but mats and visibility supervision must be verified. Gold: **related; potentially issued permission subject to scope and prerequisites; HUMAN REVIEW**.
- M3N (negative): permit clause about pyrotechnics and explosions, scene is a quiet unlit sculpture shot. Gold: **not related in this specific clause; never infer global filming clearance**.
- The four R8 cases C02/C06/C01/C05 are available as familiar controls. The R8 Extract responses have **not** been relabeled as Decide results.

## Evidence boundary

The Node tests verify payload shape, operator protection, two source quotes, exact offsets, credit field handling and conservative mapping through a **mock Clocked transport**. No actual Clocked Decide API response exists in this archive. We must not claim the semantic breakthrough until the owner provides a real response passing the preregistered M3A and contrastive criteria. The clip-safe demo is conditional on this gate.

**No app calls are made on page load. No keys or operator token are included in any JSON export. No API call retries automatically.**
