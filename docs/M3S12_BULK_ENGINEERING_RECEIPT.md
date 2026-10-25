# M3-S12 bulk engineering | v0.10.0 | durable integrated Clocked analysis

**Functionality implemented in the connected production-workspace flow:**

- The real, source-bound project task planner now feeds the Clocked Decide transport directly, rather than requiring users to switch to unrelated two-scene research demos.
- Bounded owner-initiated batches: 1-32 newly attempted tasks; `X-Operator-Token` only, no key in browser, original model secret stays server-side. Hourly local limiter is preserved, independent of provider-side controls.
- Project-scoped durable execution journals are written to a stable private application-data directory. A task is persisted as **IN_FLIGHT BEFORE provider dispatch**. Completed responses are journaled per task before any later request is attempted. No model call is automatically repeated after restart.
- Source/scene/document/request hashes bind each response to its exact original documentary evidence and provider-request payload. Journal SHA256, task count and quote/scene identity checks fail closed on corrupted records.
- Interrupted, invalid, timed-out or failed calls become **HALTED_UNKNOWN_BILLING** on the affected source plan. After an unclean process exit, even an in-flight task with unknown billing cannot be re-sent; recovery requires owner investigation, not blind retries.
- A document/call-sheet revision produces a new independent plan identity; old results stay archived and never silently become current. Human review changes alone do not invalidate unaffected source-scoped results. The execution writer locks each project across processes.
- Paginated results include per-scene coverage and individual task statuses; the Productions view now distinguishes NOT EVALUATED, PARTIAL and source-segment COMPLETE. Positive generic location consent is displayed as **scope unverified** without changing the raw Clocked outcome.
- Original source-bound per-task model outputs are available through read-only `/api/workspaces/<id>/execution/export` and downloadable JSON from the local Productions view. No authorization or API key is in the evidence export.
- The older U01/U02 experiments, frozen scoring, original source hashes and **research replay** are unchanged.

## Hard boundaries

1. New project AI execution was **tested using injected fake transport only** in this increment. No new real provider calls; owner live model behavior on arbitrary imports is unverified.
2. Full PDF/DOCX import, general multi-document legal precedence inference, signed-document validation, complex schedule validation, multi-user auth, complete legal-document coverage and final user-experience redesign remain for future bulk increments.
3. No retry is attempted after unknown billing, even if the provider might not have charged. A stranded `.clocked-execution/<project>.lock` from an OS crash requires manual investigation; DO NOT automatically delete locks or replay uncertain calls.
4. Current plan limit is 3,000 candidate tasks, and each explicit click can attempt at most 32 new tasks. No claim of arbitrary-scale execution or infinite processing.
5. Every result remains a source-limited, uncalibrated model judgment; nothing grants filming clearance.
6. Offline project planning/review is accessible only on loopback. Do not deploy with writable project routes publicly without authentication, abuse controls, authorization and privacy protections.

## Engineering acceptance

- Local Node 22 suite: **150/150 tests PASS**, no tests skipped, synthetic/injected provider only.
- Frozen U01 = **5/5**, U02 = **5/5**; offline U03 short-clause sentinel remains.
- No Windows GUI review expected at this increment. **Windows owner automated run required** via `scripts/Verify-M3S12.ps1`.
