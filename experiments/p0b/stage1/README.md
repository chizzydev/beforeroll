# P0-B Stage 1 execution preparation — owner-operated, C only

26 October 2026. **PREPARED, NOT EXECUTED.** Implementation/testing made zero Clocked requests and spent zero credits. No actual provider results or deployed-schema acceptance are claimed.

This implements the user's authorization to prepare Stage 1, using the supplied frozen championship contract. The document's later stages do not authorize blind execution or production migration. The live command below is exclusively for the owner to execute separately.

## Exact Windows PowerShell command

```powershell
Set-Location -LiteralPath 'C:\Users\HP\beforeroll-codex-phase1'
node .\experiments\p0b\stage1\cli.mjs --live --acknowledge-four-one-shot-requests
```

This is the only supported live command. It reads `CLOCKED_API_KEY` from the runtime process environment, or the project's existing `.env` if the environment value is absent. Do not put the key in the command. The parser reads one unambiguous key assignment, supports ordinary quoted/unquoted values, rejects unsafe header characters, and does not change the file or environment. Implementation/testing did not read the real credential file. Tests used disposable synthetic credentials and temporary files only.

Optional **network-free** preflight, which does not read credentials or create execution files:

```powershell
node .\experiments\p0b\stage1\cli.mjs --verify
```

Owner inspection after completion or interruption, also network-free:

```powershell
node .\experiments\p0b\stage1\cli.mjs --report
```

Do not rerun the live command to improve an answer or recover a lost response. The permanent execution fence makes it refuse even if a prior run crashed, failed before its first POST, or left later probes unattempted. **Do not delete, move, replace, restore an earlier copy of, or bypass the execution directory to obtain another attempt.** This runner has no resume/reset/retry command or alternate output directory. Further experiments would need separate authorization and protocol, not removal of this fence.

## Scope and preservation

All additions are confined to `experiments/p0b/stage1/`. No existing file was modified, including Stage 0 definitions, tests, artifacts or logs. No production app, UI, owner records, credentials, existing journals or historical recordings were changed. No Git mutation, server restart, package installation, Extract/Fill call, blind-package access or autonomous operational handling occurred.

The four immutable probes are Scene 47/U002, Scene 47/U003, Scene 48/U004 and Scene 47/U004, in that order. Only their prepared **C** bodies are sent. B bodies are checked as part of Stage 0 identity verification but never dispatched. The run therefore has at most four original requests total and one per probe, with fewer on any halt.

This is exposed U01 development compatibility work, not independent semantic evaluation. The code does not introduce a new answer key or tune the frozen decoder/taxonomy. A type-correct but factually wrong response can still require human rejection; four accepted responses do not authorize rollout.

## Verification before dispatch

`freeze.mjs` pins all five Stage 0 prepared-file raw hashes in code, including the exact manifest file. It checks:

- Every source file hash in the anchored Stage 0 manifest, including its existing test.
- Contract, baseline configuration, source-map and preparation identities.
- Four exact task identities, source bindings and B/C request hashes.
- The current request bytes against the frozen C hash.

The complete Stage 0 verification is repeated immediately before every probe. Dispatch serializes the prepared C body, not a newly authored request or a regenerated alternative. A freeze failure halts. The live CLI also checks `runner-manifest.json` against the Stage 1 implementation/test files.

Unchanged Stage 0 fingerprints:

| Identity | SHA-256 |
|---|---|
| Request contract | `c87e4120c2b4fbdc9ebdfffc44029d6397c6b63eac25969f51565d29fa8c4805` |
| Baseline configuration | `5a2bf2aec826d54de89e1649a43d9a799ce663c3f5ffeb54aacb801a682de84e` |
| Baseline implementation | `2cbdf8b65fcb63165dfdfa44fd7af0faa288a8775e3d00acbcdaaa8c0286804f` |
| Harness source map | `608adc7470e4c0c998b1c6188cb9c125722a86d4919219f22c715b82d93b4067` |
| Prepared development artifact | `351da7bff7785d4a63d5195a128533d080d1fbcb8d9dd0fd1d592690ba349982` |

Stage 1 implementation/test/ignore-file source-map fingerprint:

`15756f16982c0c0ec31d3664f8a9ee8afea15ee85d3553feed3056a38f4e77e7`

Full constituent hashes are in `runner-manifest.json`. Prose and test-output logs are outside that source fingerprint. Preserve an independent copy of these manifests; checksums and a local event chain are tamper evidence, not digital signatures.

## One-shot dispatch and durable evidence

The fixed live directory is:

`C:\Users\HP\beforeroll-codex-phase1\experiments\p0b\stage1\owner-execution`

It does not exist at this handoff. Its exclusive creation is the permanent run fence. Concurrent processes cannot both claim it. The runner never removes or expires it. A pre-existing directory, symlink, incomplete run or storage error blocks a new execution. This is enforced by the supported CLI against retained local storage; filesystem administrators can of course destroy that storage, so its custody must be preserved.

For each probe, the exact request body, a request intent containing source/request/contract identities and an idempotency key, and a hash-linked `INTENT` event are each written exclusively and `FileHandle.sync()` completes **before** entering transport. Any write failure prevents that dispatch. A run fence remains consumed even if storage fails earlier.

Transport uses one built-in `https.request` POST to the fixed `https://clocked.rezolve.ai/clocked/decide` endpoint. There is no SDK retry policy, redirect following, fallback, authentication refresh or later resubmission. A 45-second deadline applies. Idempotency metadata is retained but provider deduplication is not assumed to make a retry safe.

Responses retain exact received entity-body bytes, status/status text, HTTP version and ordered/case-preserving `rawHeaders` (including duplicates). These are HTTP response evidence, not a TLS packet capture or a byte-for-byte reconstruction of header whitespace/chunk framing. Receipt timestamps are UTC ISO strings; latency uses a monotonic clock around transport. Model, usage, raw credit headers and known credit fields are recorded as returned, including on rejected HTTP responses when parseable. Missing/malformed credit values remain unknown, never estimated as zero.

Raw data is persisted before accepting derived evidence. A transport/body failure retains the received prefix with `complete:false` and halts as uncertain. An 8 MiB response limit also halts as uncertain and preserves the received prefix. HTTP rejection (including redirects/rate limits), invalid UTF-8/JSON/schema, or a frozen semantic-consistency flag halts before the next probe. Exception text is never persisted or printed because a transport exception can contain authorization data.

A hard process termination can prevent in-memory response bytes from reaching disk, or interrupt report assembly. The already-synced intent/fence still prohibits resubmission. `--report` identifies unresolved intents or incomplete storage; it never repairs a journal, resumes requests or claims partial evidence is a complete run. Durability assumes the local filesystem honors successful file-sync operations; it is not an assertion of immunity to disk destruction.

If a response echoes the runtime credential (including ordinary JSON escaping or base64), the exact body and headers are sealed with AES-256-GCM and HKDF-SHA256 using that credential plus a random salt. The derivation domain, salt, IV and authentication tag are retained, not the credential/decryption key. The run halts and does not put the echoed credential into readable diagnostics or candidate reports. Lossless decryption is covered by an offline test. This exceptional evidence requires the original credential for later decryption; no automatic retry or permissive fallback follows it.

## Owner result package

On an ordinary completion or handled halt the directory contains:

- `run.json`: execution origin, Stage 0 anchor, Stage 1 source fingerprint, four-call maximum and C-only policy.
- `NNN-event.json`: sequential hash-linked immutable start/intent/outcome/finalization events.
- `probe-01/` through attempted probes: `request-body.json`, `intent.json`, exact `response.body.bin`, `response.headers.json`, `receipt.json`, `outcome.json`; a credential-echo response instead uses `response.sealed.json`.
- `result.json`: all four source pairs, explicit attempted/unattempted states, receipts, frozen classifications/candidate derivations, and comparison.
- `index.html`: escaped, script-free offline evidence/candidate view. No provider calls or confirmation controls.
- `package-manifest.json`: exact artifact hashes and aggregate file-map fingerprint.

The owner can open `owner-execution/index.html` after execution. The folder is ignored by the new local `.gitignore` to keep raw owner-run evidence out of accidental commits; it is still a normal auditable local package. Preserve it as a whole. No backup/recovery of production data is performed.

`--report` verifies event links and referenced intent, outcome, raw response and finalized-package hashes. Corruption causes a read-only integrity failure; it is not silently repaired. A missing final package after interruption is reported as incomplete/uncertain.

## Candidate provenance and comparison

The unchanged Stage 0 decoder and constructor produce candidates only for schema-valid, semantically consistent responses. Candidates retain exact quotation, scene/document/unit/hash/revision, incomplete supporting-packet coverage and `MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED`. Negatives, uncertainty and empty action selections remain inspectable human-review work. No scene is cleared and no human condition or decision is written.

The frozen constructor's original `OFFLINE_RESPONSE_VALIDATION_NOT_LIVE_EVIDENCE` derivation label is retained rather than rewriting frozen behavior. A **separate execution-provenance receipt** links actual live owner execution to run ID, probe, request hash and raw-body hash. Stage 1's view displays that receipt origin explicitly. Controlled tests use `CONTROLLED_NETWORK_FREE_TEST_NOT_CLOCKED_EVIDENCE`, never a live origin.

The comparison is intentionally bounded:

- A: frozen BM25 rank/score and existing AI-off rule findings for the same source/scene.
- B: `NOT_DISPATCHED`, no fresh output, no invented UI/action-queue measurements. The existing workflow remains two scores followed by human source investigation.
- C: actual observed typed classifications, source-linked candidate families, status, latency, usage and reported credits where present.

Human reconstruction steps, click/typing burden, semantic correctness, comparative B/C costs and sponsor-value gains remain **unmeasured**. A four-response acceptance status is named `ALL_FOUR_ACCEPTED_PENDING_HUMAN_SEMANTIC_REVIEW`, not championship PASS. An owner must still inspect whether the restriction, conditional addendum and unissued/other-scene request were understood correctly. No production rollout or blind-stage authorization is inferred.

## Network-free verification results

Windows, Node `v24.13.0`.

| Final run | Passed | Failed | Skipped | Cancelled | Duration |
|---|---:|---:|---:|---:|---:|
| Unchanged Stage 0 + new Stage 1 suites | 109 (67 + 42) | 0 | 0 | 0 | 7,942.8209 ms |
| Existing production suite | 523 | 0 | 0 | 0 | 22,526.6675 ms |
| Total distinct tests | **632** | **0** | **0** | **0** | — |

Evidence: `verification-experiments.tap`, `verification-production.txt`. Production tests used localhost fixture servers with offline/controlled transports. No live command was executed, including during testing.

Coverage includes exact C-only bodies and durable intent at transport entry; permanent and concurrent fences; abrupt child-process exit; lost/partial/oversized responses; HTTP 301/400/401/422/429/500; invalid UTF-8/JSON/types; semantic contradictions; raw bytes/duplicate headers/timing/usage/credits; credential-echo sealing; storage and integrity failures; frozen-file tampering; credential parsing; one-call HTTPS behavior via an injected socket-free request implementation; and CLI rejection of unsafe/unsupported commands. No current owner credential was used by these tests.

Final offline CLI observations:

- `--verify`: `VERIFIED_NOT_DISPATCHED`, four C probes, credentials unread, zero requests, permanent fence absent.
- `--report`: `NOT_EXECUTED`, zero intents, zero accepted responses.

Reproduce the tests without any Clocked service:

```powershell
node --test experiments/p0b/stage0.test.mjs experiments/p0b/stage1/stage1.test.mjs
npm test
```

## Exact additions

No existing file was modified. New files, all in this directory:

| File | Purpose |
|---|---|
| `.gitignore` | Excludes the future owner execution directory from accidental commits |
| `freeze.mjs` | Hard Stage 0 anchors and full pre-dispatch verification |
| `credential.mjs` | Runtime-only credential lookup without disclosure/mutation |
| `store.mjs` | Exclusive synced writes, permanent fence, event chain, secret-echo custody |
| `transport.mjs` | Fixed one-request HTTPS adapter, no retry or redirects |
| `runner.mjs` | Serial C-only execution, receipt/validation/halt/candidate pipeline |
| `report.mjs` | Honest comparison, offline view, checksum package and read-only inspection |
| `cli.mjs` | Explicit owner live gate; safe verify/report commands |
| `stage1.test.mjs` | 42 network-free tests |
| `runner-manifest.json` | Stage 1 source freeze |
| `verification-experiments.tap` | 109-test passing experimental log |
| `verification-production.txt` | 523-test passing regression log |
| `README.md` | This handoff, owner command, boundaries and limitations |

**Stop point: Stage 1 execution preparation only. The owner executes separately.** Deployed six-question acceptance, response-map completeness, threshold conventions, latency, real credit use, semantic quality and useful action discovery remain unverified until actual authorized owner results exist. No frozen criteria were relaxed to avoid these possible failures.
