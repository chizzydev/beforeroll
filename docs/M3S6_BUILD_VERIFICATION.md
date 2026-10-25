# BeforeRoll M3-S6 build and evidence receipt v1.0

Build: cumulative M3-S5 source + new unfamiliar synthetic case loader, blind preregistration, source-coverage diagnostics and independent scoring harness. No Clocked API calls performed during development or testing; U01 and U02 AI output remains genuinely **unobserved**.

**Automated checks:** Node.js 22.16.0 `npm test` = **83/83 PASS**, 0 failed; fresh ZIP extraction tested independently. `node scripts/evaluate_m3s6.mjs --preflight` = PASS (U01/U02 source and gold hashes, exact 8-call plans, U03 short-clause coverage sentinel). Browser-like DOM harness loaded both new cases, verified correct scene/date labels, no model results, and zero-credit baseline. HTTP server local `/api/health` and frozen fixture delivery returned JSON properly.

**Visual limitation:** Headless Chromium navigation to the local server returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` in this environment, so **no live visual browser acceptance is claimed**. Real Windows GUI acceptance remains an owner gate.

**Scientific limitations:** U01/U02 newly authored cases are **not** third-party or independent real-world validation; no model correctness statistics exist until owner runs and exports live Clocked responses. Mocked transport responses in old automated tests verify plumbing only. The golden expected bands are frozen before API use and are not included in any Decide payload. A perfect score on 5 assertions would establish only a *narrow synthetic pass*. U03 is known negative coverage sentinel ("No drones." omitted by minimum clause length), never claim exhaustive discovery.

**Safety:** the package contains only synthetic cases and previous owner-recorded model evidence. No actual API key/token is included. Local recorded-mode routes are read-only; live usage requires a locally held Clocked key and separate operator authorization; no retry after errors.

**Deployment:** Not deployed; no public demo/YouTube video or challenge submission yet. Read `docs/M3S6_DEPLOYMENT_SECURITY_AND_SUBMISSION.md` and `docs/M3S6_JUDGE_DEMO_AND_WRITEUP.md` before finalizing.


## M3-S7 follow-up (25 October, separate from original M3-S6 build acceptance)

Owner-supplied U01 original evidence verified offline in a new regression: 8/8 complete and frozen scorer 5/5. Subsequent patch reclassifies unscoped model-positive Scene 48 location consent as a scope question, not a conditional activity-specific variation. Local owner hourly cap is now configurable with 256 attempts/hour default. This hotfix needs owner Windows acceptance after installation; older screenshots do not establish patched UI acceptance.
