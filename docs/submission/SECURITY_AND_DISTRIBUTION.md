# Release architecture and security

## Selected distribution

| Approach | Accessibility / operation | Actual security assessment | Decision |
|---|---|---|---|
| Hosted shared Evaluation server | Immediate URL; one process cheap to operate | Existing app deliberately trusts direct loopback only. Tabs/users on one process share fictional mutations/reset; reverse-proxy headers are rejected. Ordinary owner server is not a multi-user public service |Not selected; do not tunnel or weaken fences |
| Local reproducible Evaluation + owner-recorded actual-use video | No credentials; reviewers can inspect source and reproduce locally; public video removes install friction | Independent temporary process per local judge, no paid routes, original evidence included; no external hosting/security maintenance |**Selected**; public source and completed owner video available |
| Combined hosted+local+video | Best eventual reach | A public host would need separate short-lived sandbox per visitor, hard egress denial, upload/resource limits and deployment testing. That infrastructure has not been implemented/validated |Optional future work, not needed to submit a reviewable actual-use video |

No external application deployment is claimed. The [public repository](https://github.com/chizzydev/beforeroll) and [completed video](https://youtu.be/Ng_lMzWNlTs) are available. Published rules accept a working demo link **or short actual-use video**. Owner must keep the selected demo and repository publicly reviewable through18Nov2026. The selected local launch configuration is validated; an external hosting configuration is **NOT_APPLICABLE** to this candidate. No Docker/cloud/proxy recipe is offered as if it were tested production hosting.

## Real route audit

The complete server source and static allowlist were inspected; `verification/batch-d-release/route-inventory.json` records each actual route/action branch with source line. The server does not serve arbitrary directories. Public source distribution and HTTP exposure are distinct.

| Surface | Evaluation behavior / protection |
|---|---|
| `/`, known modules/CSS and explicit fictional fixture aliases |Fixed `staticFiles` allowlist only; no directory traversal. CSP self-only scripts/styles/connect, no framing, no-sniff/referrer/permissions controls, no-store |
| `/api/health` |Evaluation/default fictional project/live-disabled status; no key/token or filesystem directory |
| `/api/production/plan` |Bounded deterministic planning only; no provider dispatch |
| `/api/owner/status`, unlock, lock |No owner token or owner store in Evaluation. Ordinary private mode retains RAM sessions, expiry, throttling, HttpOnly/SameSiteStrict and existing authentication |
| `/api/workspaces` and nested read/write/import/source-change/review/history/export actions |Direct loopback peer + Host/port + same Origin/fetch metadata, no forwarded proxy headers. In Evaluation all data are in explicitly supplied temporary fictional store/vault/execution, not configured owner directory |
| `/api/workspaces/:id/discovery` POST commands |403 in Evaluation before planning/authorization/transport; GET shows recorded source-bound evidence |
| `/api/workspaces/recovery/verify`, `/restore` |403 in Evaluation; private encrypted separate-copy recovery remains authenticated/validated |
| `/api/evaluation/replay`, `/reset` |POST, loopback/same-origin; exact recordings only. Reset affects this one temporary server, never owner data |
| `/api/extract`, `/api/semantic`, `/api/semantic-sweep`, `/api/semantic-batch` |503, disabled provider configuration; zero transport calls even if ambient test credentials exist |
| `.env`, `.git`, owner directory, server/source internals outside allowlist, scripts/docs/verification paths |404; tested by actual HTTP, including traversal probe |

The new local launcher creates a validated `makeEvaluationRuntime({includeLastLight:true})`, binds127.0.0.1, explicitly sets no provider key/operator credential and installs a throwing/counting transport. It does not load `.env`. Shutdown disposes its own temporary directory and prints actual providerCalls. No security boundary was relaxed for packaging. The only production server change corrects an obsolete denial message claiming only U01 was available; the same403/no-fresh-call rule remains.

Separate local processes have different directories/reset state; demonstrated with actual HTTP. Two tabs on one process deliberately share state; do not market that as public session isolation. Local imports/reviews are disposable. Fresh responses can only come from the private explicit-authorized owner workflow, which is not the public demo.

## Source and history security

Original reachable Git:14commits,1,163objects (1,042blobs),43,679,683uncompressed bytes; configured-secret/private-key/common-token scans found0matches, including343decoded JSONbase64 fields. This is a bounded exact/pattern scan, not universal secret-detection or screenshot OCR.

The audit found13research screenshots of other products. Public history is a transparent derivative omitting those images only, with original/public SHA mapping and unchanged source/author/date/message. Full original history stays protected. BeforeRoll failures/provider answers/gold are not rewritten or rescored. Public clone originates from a bundle containing only the mapped branch; old original refs/config/reflogs/unreachable objects are not distributed. The owner authorized publication with retained author metadata and existing rights.

Current release uses an explicit file selection and hash inventory. `.env`, disposable stores, encrypted/corrupted backup envelopes, unnecessary duplicate dispatch intents and the archive-only test stay local. The owner explicitly chose this exclusion. Necessary fictional saved responses remain to reproduce semantic/decoder regressions and exact Evaluation; they are labeled historical and ordinary startup cannot dispatch them.

Final current-tree/reachable-public-history checks, original-source/evidence pins, README local links, original screenshot hashes and decoded evidence scan are recorded in the final manifest/security receipts. Do not publish the development root, old scratch clone or `verification/batch-d-release` wholesale. The owner-approved public derivative is published; corrections use an isolated checkout and normal reviewed commit.
