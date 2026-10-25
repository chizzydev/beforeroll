# M3-S27 — Production-wide durable execution, v0.25.0

## Basis and verification scope

This release is cumulative source from M3-S26 v0.24.0. The owner has not yet supplied Windows verification receipts for M3-S23 through M3-S26. Local automated Node tests are not Windows GUI tests or real Clocked provider tests. The frozen U01/U02 source recordings are preserved and scored without sending requests. No model calls were made in this increment.

## New behavior

- **50,000 exact scene×source-unit source-bound requests** per current plan, up from the 3,000 task limit. The planner counts scene-unit Cartesian products before building task payloads; it must reject plans that exceed the explicit resource ceiling, with NO silent truncation or automatic task selection. The overall document parser's per-document length/segmentation limits remain unchanged. Splitting a larger production requires accountable reviewed phases; 50k is a safety capacity, not unlimited scale.
- **Crash-conservative large-journal execution.** For plans of more than 3,000 requests, BeforeRoll preserves an immutable full baseline and appends SHA-256 chained, fsynced dispatch-intent and settlement events. This avoids rewriting a many-megabyte 50k-entry snapshot after every provider request. Tampered, partial and out-of-order journals are rejected; a recorded uncompleted dispatch becomes `BILLING_UNKNOWN` before any later task can be dispatched. Exact-source task identity remains mandatory. Existing <=3000 task snapshots are byte-format compatible, and historical backup/recovery materializes the complete validated ledger (including large events).
- **One explicitly owner-authorized session of 1–256 new attempts.** Browser issues successive 1–32-request server batches, each durably checkpointed. A new explicit owner action is needed to start any later session: it does not resume on page refresh/restart. Any network error, unknown billing, exhausted plan or provider error stops the chain. Existing server endpoints continue to require separate operator authentication and `RUN_PROJECT_CLOCKED` authorization per batch. A batch remains capped at 32; the browser cannot bypass that bound.
- **Scalable paging and navigation.** Review pages, scene workbench pointers, source plan GET responses, execution status pages and cross-scene action navigation support offsets above 3,000. `/api/workspaces/:id/plan` now returns bounded, explicit pages (default 100, max 500) with full untruncated counts; clients must follow `pagination.hasMore`. Source-linked evidence export and integrated dossiers still include all planned tasks; they are intentionally large and the owner should allow memory and disk headroom.
- **Meaningful progress and cost visibility.** The current execution status includes completion percentage, remaining not-attempted tasks, per-scene and per-document counts, known reported credits, count of unavailable per-request credits, local-process hourly request slots, and clearly labeled observed-cost projection only when actual credit samples exist. Projection is NOT the provider's remaining credit balance, a quote, calibrated estimate or spending ceiling. No unknown credit total is invented.
- **Large project workflow integrity.** Scalable source-bound review/dossier grouping avoids repeated scanning by scene; old 3k navigation and 10k action offset fences no longer block real scene/task links. Conditions can exceed the old 3k store cap. Same historical human review and source-change protections apply to large projects.

## Recorded automated evidence

- Cumulative Node suite: **445/445 PASS** before packaging (13 new large-production tests on the existing 432).
- Scenarios include a complete 140-scene × 36-clause = **5,040-task** plan, no omitted tasks, exact full-source identity, paging at offsets 4,000–4,500, resume after process restart with no duplicate calls, per-scene/document progress, observed-credit uncertainty, cost projection, owner-facing UI, HTTP plan/status pagination, archived journal portability >3000, SHA-chained append-only events and tamper/truncation refusal, and crash after durable dispatch intent without automatic resend.
- The 50k ceiling is tested to fail closed *before* task generation when exceeded.
- No Windows GUI, live-provider execution for the new large workflow, actual production billing or large-machine multi-hour stress claims. Data still resides on local disk without cloud auth.

## Remaining project work

Subsequent product hardening and coordinated first-use/real-provider validation must verify end-to-end user experience on the owner's Windows environment, adversarial real-world source variants, provider rate limits and actual credit behavior. The final UI/UX redesign remains a separate user-approved phase after functional work. Do not advance those milestones based only on the number of unit tests.
