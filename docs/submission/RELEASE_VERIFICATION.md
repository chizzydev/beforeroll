# Verification scopes and evidence

Current public distribution, 28 October 2026. Node 24.13.0 / npm 11.6.2 on Windows; Node 20+ is declared, not separately binary-tested. No runtime dependencies or build step. **No fresh Clocked requests are needed or authorized by these checks.**

## Reproduce the public scope

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\release\Verify-Release.ps1 -NoLaunch
```

Portable equivalents:

```sh
node scripts/release/verify-distribution.mjs
node scripts/verify-coordinator-evidence.mjs
node scripts/verify-last-light-recording.mjs
node scripts/release/test-public.mjs
node --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs
```

The accepted public baseline is **661/661 native application tests and 109/109 frozen tests, zero failures/skips/cancellations**. `npm test` also runs those 661 native cases in the public tree. Repeated runs are not added to these distinct totals. The final correction's rerun is recorded in [the final release receipt](FINAL_PUBLIC_RELEASE.md).

Tests cover source identities, revisions, strict contracts/quotations, scene isolation, durable uncertainty, review persistence, exports/recovery, authenticated boundaries and Evaluation isolation. Controlled fake transports are offline engineering tests, not fresh provider results. The frozen harness preserves its existing request/baseline fingerprints; do not execute its paid runner or reset historical fences.

The coordinator verifier reads the exact accepted U01 evidence at `fixtures/audit/U01_ACCEPTED_EVIDENCE.json`. It is the unchanged JSON formerly carried in an internal handoff directory; the verifier's packaging path changed. Its stale acceptance-status diagnostic now says `NOT_MEASURED_BY_THIS_OFFLINE_VERIFIER`; owner acceptance is documented separately. Existing assertions are intact.

## Protected archive scope stays separate

The original protected workspace has **662 native cases**, including one unchanged archive-integrity assertion in `tests/protected-archive.test.mjs`. It requires private preservation archives, including encrypted backups and disposable stores explicitly excluded by the owner. That assertion and original archives remain local; neither is shipped or claimed as passed by the public 661-test procedure. No assertions, expected hashes or test semantics were weakened.

The [dated Batch D report](../BATCH_D_SUBMISSION_CHAMPIONSHIP_REPORT.md) documents the original 662/661 scope separation and failures repaired before release. Historical receipts describe their own build, not current pending actions.

## Genuine provider evidence

The exact [Last Light recording](../../fixtures/audit/LAST_LIGHT_COMPLETE_RECORDED_v1.json) is SHA-256:

`2cc34e798efe694df045418082e29f8b6c3b5b35f600f4167305a9ce5cc30954`

It contains **23 genuine requests / 62 reported credits**: 14 Decide, four Extract, five Fill. Its validated final projection has six prerequisites and two documentary investigations. The general venue Fill scope disagreement stays disclosed. No automatic authority/fulfillment decisions are inferred.

The original adaptive Batch B campaign (39 requests/150 credits), earlier core campaign (57/102), U01/U02 records, failed attempts, frozen source/gold and request/response evidence remain historical and closed. Current release checks do not rerun them. Native decoder tests replay saved responses; genuine-provider status comes from the original receipts, not mocks.

## Browser and independent acceptance

Accepted agent-operated browser evidence covers Last Light, exact sources/refresh, S31/S32 isolation, explicit fictional review, Work/History, actual JSON/Markdown downloads, reset and U01/U02. Private separate-copy recovery has full regressions and accepted Batch B/C browser evidence. See [Batch C browser acceptance](../BATCH_C_BROWSER_ACCEPTANCE.md).

The owner has now **independently accepted the essential Windows workflow** and completed the [narrated actual-use demonstration](https://youtu.be/Ng_lMzWNlTs). This status is owner-confirmed; it is not fabricated as a new agent-operated Windows session. Older reports accurately describe acceptance as pending at their dates.

The release launcher runs a temporary fictional runtime with no credential and a throwing/counting provider transport. Graceful `stop` reports `providerCalls=0 temporaryDataDisposed=true`. Two tabs share one process; separate processes are isolated. Evaluation is local, not a hosted multi-user service. No additional owner GUI acceptance round is required for this documentation-only correction.

## Distribution and historical receipts

`RELEASE_MANIFEST.json` inventories the current public tree, excluding its own hash. [The RC1 inventory](../../verification/releases/RC1_RELEASE_MANIFEST.json) is preserved unchanged as a historical receipt; its old paths describe RC1. Published source history and [original/public mapping](PUBLIC_HISTORY_MAP.json) are retained. Excluded preservation archives remain local and do not become public merely to satisfy tests.
