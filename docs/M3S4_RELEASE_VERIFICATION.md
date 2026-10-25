# BeforeRoll M3-S4 v0.4.0 — Release verification

**Release:** source-backed multi-scene Clocked preflight pilot. **Not a filming clearance system.**

## Checks performed on packaged source

- Node.js `npm test`: **63/63 PASS, zero failed**. Prior M3-S3 baseline 55 tests plus 8 M3-S4 new tests.
- `node --check public/app.js`: PASS. `server.mjs` and source modules execute in automated tests.
- Local HTTP offline smoke test: `/api/health` 200 (v0.4.0, live=false); `/`, `/app.js`, `/src/desk-semantic.mjs`, `/fixtures/M3B_OWNER_SWEEP` 200; `/api/semantic-batch` denied with HTTP 503 in offline mode.
- Independent Node fake-transport tests: two scene/three clause scan, distinct source hashes and record binding, mock conditional documentary grant only to Scene 31, ambiguity retained, malformed response fails closed, partial results leave later scene NOT EVALUATED, bad identities rejected before spend.
- Race safety review: an original source or scene-row change during a browser-initiated live scan discards the result rather than re-attaching stale Clocked evidence. No request is retried.
- Package source hashes are in `M3S4_SOURCE_SHA256_MANIFEST.txt`; the final ZIP is tested by clean extraction and a second full `npm test` run.

## Evidence distinction

- The four recorded Clocked Decide replies are the **owner's previous M3-S2 live Scene 31** results on fictional data.
- Scene 32 has **NO genuine live Clocked model answers yet**. Offline replay correctly reports `NOT AI-EVALUATED`. The second scene route tests use **mocked transport**, not actual model inference.
- No real Clocked API calls or credits consumed to create M3-S4.
- The complete new live multi-scene flow requires explicit Windows owner execution; it is **NOT owner-accepted** yet.
- A Chromium full server navigation attempt in the build environment returned `ERR_BLOCKED_BY_ADMINISTRATOR`. An offline non-server preview image exists from the earlier harness, but it is **not Windows browser acceptance**. Do not state otherwise.

## Live risk and limits

One authorized two-scene batch makes at most **8 sequential, separately billable Decide calls** (2 scenes times up to 4 detected clauses each). No retries. A count cap does **not** impose a financial cap per call. Operator token and server-side key required. On any unknown billing status, reported total is null and the known subtotal is separate. Signed exceptions, applicability, document authenticity and fulfilled safety prerequisites are **not** certified.

Plain-text permit and explicit scene rows only. Short clauses, cross-paragraph conditions and complex source authority may be missed. Continue tracking more robust discovery, professional/independent validation, public deployment and contest written submission.
