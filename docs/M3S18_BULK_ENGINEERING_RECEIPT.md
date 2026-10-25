# BeforeRoll M3-S18 — unified scene operator workbench

Source: owner-accepted M3-S17 v0.15.0 (240/240 Windows tests).
Release: v0.16.0. No provider calls during engineering, local server tests use simulated Clocked responses. All old owner-recorded Clocked evidence remains unchanged.

## Cohesive integration

- Scene-centered read-only packet in `src/scene-workbench.mjs`, computed from the **same** current versioned dossier used by action queue, Clocked execution, source changes and human review. No additional mutable store.
- Exact original call-sheet row, scene-specific source assessment tasks with original SHA-256 and Unicode spans, current model outputs distinguished from NOT_ATTEMPTED and unknown billing, original documents, human documentary claims and full historical status, scheduling/prerequisite review and source-level documentary links.
- Dossier fingerprint verification, deterministic SHA-256 packet identity, independent pagination of source tasks/action items, exact mapping from scene-local to globally ordered task index. Fail closed on scene identity, tampering and malformed pagination.
- Local-only HTTP `GET /api/workspaces/{id}/scene-workbench?sceneId=S7` with current persisted workspace version. Disabled for non-loopback, same-origin restriction inherited.
- Production browser now offers a scene operator view with exact scene/source task navigation, current model status, document claims, prerequisites, action queue and **human decision entry via existing source-bound `/review-task` endpoint**. Existing evidence journal / source verification is reused, not duplicated. No new APIs can charge Clocked.
- 18 independent M3-S18 tests cover source and scene completeness, >100 tasks and pagination, human review and source-change retirement, simulated Clocked completion/uncertainty, safe HTML escaping, local HTTP cross-origin rejection, full cold-start import + real checkpoint persistence + simulated analysis + review + server restart + permit revision, and browser controller navigation + saving.

## Boundaries

- This is functional integration and an automated unit/HTTP-controller gate, **not final UI/UX** or comprehensive manual GUI testing.
- Model tests in this increment are simulated. Original U01/U02 recordings are **read-only owner evidence** re-scored independently in Windows gate; unchanged previous narrow-science verdict.
- Scene selection, evidence, work actions and source-review mutation now share a common projection. More work may remain after later complete-product audit, including unfamiliar-real-document and operator cold-read testing.
- Source claims, document precedence and human decisions do not constitute legal or filming clearance.
