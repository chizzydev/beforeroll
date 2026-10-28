# P0-B Stage 0 — isolated preparation and local/schema gates

26 October 2026. **Stage 0 complete; provider schema compatibility UNVERIFIED; operational rollout HOLD.**

No inference requests, credits spent, SDK installation, environment reads, production integration, autonomous handling, Git mutations, owner-workspace operations, or changes to the existing application interface were performed. No sealed blind inputs or answer key were created, inspected or reconstructed. No new semantic evaluation results exist.

## Authority and preservation

Read the complete P0-A feasibility report and the complete supplied championship contract. The user's instruction authorizes Stage 0 only; the attachment supplies the frozen experimental design, not authorization for later stages. The older general engineering mission does not expand this stage's authority.

Contract read from `C:\Users\HP\Downloads\BEFOREROLL_P0B_CHAMPIONSHIP_CONTRACT_v1_0.md`; its raw-file SHA-256 is `018c73e8fb35a4b4e8734fa6812109755fce5b7c9da2b38954b2dd23e9af9594`. It was not edited or copied into a mutable scoring specification. P0-A was read from `_design_implementation/07_CLOCKED_ACTIONABLE_INTELLIGENCE_FEASIBILITY.md`.

Observed HEAD: `bb5559a02944d8cec10c01fd77d46f2ebfacaf22`. Existing owner changes were retained: `server.mjs`, `public/app.js`, `public/design/components.css`, four existing `public/workspace/` modules; untracked reports 06/07, `public/workspace/action-presentation.mjs` and `tests/refinement-owner.test.mjs`. This work adds files exclusively under `experiments/p0b/`. Existing production source, tests, fixtures, historical responses, criteria and journals were not edited. Regression tests exercised their own offline fixture servers; no running owner server was restarted.

## What is implemented

### Contracts and prepared comparisons

`contract.mjs` freezes `beforeroll-actionable-decide-v2-draft1`, all six question names, every P0-A §5 label, an explicit description for every label, shared instructions, selection policy and deterministic titles. The vendor body contains only documented request properties: `state`, `instructions`, `questions`. The application version is inside structured input state and the local manifest; no invented vendor `contract_version`, `response_format`, generated explanation or `actions[]` output is requested.

The four development probes, in fixed order, are:

1. U01 Scene 47 / U002.
2. U01 Scene 47 / U003.
3. U01 Scene 48 / U004.
4. U01 Scene 47 / U004.

`development.mjs` reads only the existing, public `M3S6_UNFAMILIAR_CASES.json` fixture and selects U01. Original permit/scene hashes are checked. It does not read historical responses or any scoring gold. No caller-supplied corpus path or blind-loading command exists. Preparation produces four B payloads and four C payloads, **zero calls**, and no model outputs. Four remains the maximum authorized future Stage 1 request count, not eight; preparation of B bodies is not authorization to send them.

B calls the unchanged production `sourceBoundDecidePayload` directly, preserving the current two-question request text and property order. C uses the same exact scene/unit and original neighboring source context, with the new versioned questions. No old recording is reinterpreted as C. B's future action-queue/UI outcome is explicitly unmeasured; this report does not replace it with imagined improved behavior.

### Strict response decoder

`decoder.mjs` accepts exact raw text and retains it on JSON, schema or semantic failure. It rejects duplicate JSON keys (including escaped-name collisions), image envelopes, missing/extra answer names, wrong typed answer properties, unknown labels, missing/extra probability labels, nonnumeric/nonfinite/out-of-range values, invalid usage, duplicates in selections and inconsistent selections. There is no fallback to the old two scores and no repair/retry behavior.

Frozen **local engineering conventions**, not claims about deployed provider behavior:

- Every probability and confidence lies in [0,1]; each choice distribution sums to 1 within `1e-6` and selects a maximum-probability label (ties allowed).
- Independent multiselect probabilities need not sum to one. Both requests explicitly set threshold `0.5`; selected membership must equal `probability >= 0.5`. A returned threshold is optional, but must match when present.
- Strict text envelope is `model`, `answers`, `usage`; usage contains nonnegative safe integer input/output token counts. Unexpected envelope/typed properties fail closed rather than being silently dropped.
- Schema validity and semantic consistency are separate. Conflicting no-action/concrete selections, uncertain/concrete selections, request/issued claims, unrelated/concrete actions, background/substantive roles and unsupported complete-packet claims are flagged and quarantined from candidate creation. Flags do not erase the response or source coverage.

The supplied support manifest is always incomplete/unassessed, with no assessed supporting documents. A claim that required support was located or not located in an assessed packet is flagged. `NO_SEPARATE_SUPPORT_REQUIREMENT_STATED` describes the text, not complete evidence; `UNCERTAIN` remains unknown. No global missing-evidence inference or physical fulfillment claim is constructed. Complete supporting-packet assessment is deliberately not implemented in this stage.

### Source-bound candidate construction and isolated presentation

`tasks.mjs` derives exact Unicode codepoint slices from the original source, checks scene identity against the parsed row, preserves neighbors and binds document hash/revision/epoch, unit hash/range, scene row hash/epoch, packet identity, contract fingerprint and both request hashes into task identity. Callers can supply current source inputs to detect stale tasks; revision/epoch advancement prevents A→B→A reuse. Epoch advancement still belongs to a future integration's authoritative source lifecycle, not this pure harness.

`candidates.mjs` rebuilds that identity before interpretation. Source failures retain raw text without attaching it to an accepted source. Schema or semantic failure produces no usable cards and retains diagnostics. Accepted action-family labels map to fixed local titles attached to the **entire exact source unit**, raw answers, request/task identity, packet coverage and `MODEL_SUGGESTED_NOT_HUMAN_CONFIRMED`. No named actor, deadline, signature, operative permission, distinct-obligation enumeration or completed prerequisite is invented. Every source, including unrelated/no-action/empty selections, remains visible and requires human review.

The offline origin is `OFFLINE_RESPONSE_VALIDATION_NOT_LIVE_EVIDENCE`; the response's own model string is retained but not authenticated as a genuine request. Structural test doubles cannot establish genuine Clocked evidence. A future authorized executor must supply a separately auditable origin/receipt rather than just changing this label.

`view.mjs` supplies an escaped standalone experimental presentation for preparation and response diagnostics, entirely outside the production application. `prepared/index.html` shows the four exact requests, source quotations, source identities and all lexical rankings. It contains no provider results or fabricated action cards. It has no scripts, forms or network connectivity. Candidate rendering is structurally tested, **not** a claimed interactive product acceptance or completed B-versus-C user-burden experiment. Those require later authorization and actual results.

### AI-off baseline

`baseline.mjs` implements the standard Okapi BM25 retrieval algorithm directly, without a dependency or domain-specific adaptations. The off-the-shelf algorithm is specified completely so it can be reproduced independently rather than relying on a package's unstated defaults:

- NFKC normalization, ECMAScript locale-independent lowercase, Unicode letter/number runs.
- Exact complete scene row is the query; distinct query terms counted once.
- Corpus is every supplied source unit for the scenario, once. No relevance prefilter.
- `k1=1.2`, `b=0.75`.
- `idf = ln(1 + (N-df+0.5)/(df+0.5))`.
- `score = sum(idf * tf*(k1+1)/(tf+k1*(1-b+b*length/averageLength)))`.
- All units returned, including zero scores; ties use document ID then unit ID in Unicode code-unit order.
- No stopwords, stemming, synonym expansion, U01 terminology map, learned coefficients or score cutoff.

The complete four-unit corpus is ranked for both U01 scenes; comparisons can retrieve the same four named development pairs from those full rankings. This baseline is retrieval only, not a simulated semantic classifier or permission engine. Its unit test checks numerical scores against a separately expressed textbook calculation. U01 was already exposed development material; there was no tuning on blind material or semantic success optimization.

Lane A additionally records the existing `evaluatePreflight` output with exact source text, scene rows and **empty extracted fields**. No model extraction or fabricated manual facts are smuggled into AI-off. Known unknown-authority findings remain unknown. Existing non-Clocked rule code is not rewritten for this experiment.

## Frozen fingerprints

Fingerprints use SHA-256. Structured contract/config/source-map identities use recursively sorted JSON object keys and preserved array order (`canonical` in `contract.mjs`). Per-request hashes use exact UTF-8 `JSON.stringify(payload)` bytes, matching the existing B convention. Source implementation hashes use exact UTF-8 file contents, including line endings. Do not silently reformat files after freeze.

| Artifact | SHA-256 |
|---|---|
| Request contract, instructions, selection policy and action-title mapping | `c87e4120c2b4fbdc9ebdfffc44029d6397c6b63eac25969f51565d29fa8c4805` |
| AI-off baseline configuration | `5a2bf2aec826d54de89e1649a43d9a799ce663c3f5ffeb54aacb801a682de84e` |
| AI-off baseline implementation | `2cbdf8b65fcb63165dfdfa44fd7af0faa288a8775e3d00acbcdaaa8c0286804f` |
| Harness source map, including test and three production dependency file hashes | `608adc7470e4c0c998b1c6188cb9c125722a86d4919219f22c715b82d93b4067` |
| Complete prepared development input/comparison artifact | `351da7bff7785d4a63d5195a128533d080d1fbcb8d9dd0fd1d592690ba349982` |

`prepared/manifest.json` records every source hash, each task ID and each exact B/C request hash. `prepared/contract.json` and `prepared/baseline.json` preserve the full definitions, not only digest strings. Source hashes cover implementation/test files and the production functions actually used; prose reports and verification logs are not included in the harness source fingerprint.

Preparation was run twice with identical outputs. The writer refuses to overwrite any existing differing frozen artifact. It accepts no flags or input paths and has no dispatch implementation. File hashes are tamper evidence, not a cryptographic signature or a substitute for independent custody of the freeze.

## API declaration verification and unresolved gates

Re-read the publisher's [JavaScript SDK 0.7.0 archive](https://registry.npmjs.org/clocked-sdk/-/clocked-sdk-0.7.0.tgz) in memory, without installation, extraction or execution. Its SHA-256 matched P0-A: `5059428b64770cb0386acc54c2304ced640d438f0b25c1021bb551195fbd5eb2`. A public documentation download is the only external network operation used here; no inference endpoint or credential was involved.

`package/dist/esm/types.d.ts:142–252` declares structured/text state, shared instructions, named questions, `choice` criteria (2–255), `multiselect` criteria/options (2–64, mutually exclusive), threshold [0,1], the typed answer fields and text envelope used here. It also declares at most 64 optional documents with IDs up to 128 characters and text up to 20,000 characters each; this harness does not use the documents mode or native PDF/image mode. [Readable publisher declaration mirror](https://unpkg.com/clocked-sdk@0.7.0/dist/esm/types.d.ts).

Still **unverified/blocking future live compatibility claims**:

1. Deployed text question-count and total state/context limits; six questions are declared expressible, not proven accepted by the account/service.
2. Actual deployed response envelope and complete probability maps; the strict local decoder intentionally rejects undocumented/missing fields rather than coercing them.
3. Rounding/normalization tolerances, choice selection convention, multiselect cutoff inclusivity and optional returned threshold behavior. The frozen local policy is not represented as vendor-certified behavior. A mismatch must halt and be diagnosed, not trigger retries or silently relaxed criteria.
4. Actual latency, token/credit usage, model identity, semantic quality and utility relative to B. None was measured or inferred from unit tests, previous recordings or the SDK.

No documented schema incompatibility was found for the prepared request families. That is a declared-shape result only. Complete supporting packets, obligation-level Extract/Fill, production receipt handling, action-queue integration, human workload measurement and blind execution remain outside Stage 0.

## Verification results

Runtime: Node `v24.13.0`, Windows PowerShell.

| Run | Passed | Failed | Skipped / cancelled | Evidence |
|---|---:|---:|---:|---|
| Existing suite before harness changes: `npm test` | 523 | 0 | 0 / 0 | Tool output; 20,351.6407 ms |
| Final isolated Stage 0 suite | 67 | 0 | 0 / 0 | `verification-stage0.tap`; 483.7751 ms |
| Intermediate full suite under sandbox-denied localhost access | 316 | 207 | 0 / 0 | `verification-production.txt`; 9,442.872 ms; `connect EACCES 127.0.0.1` |
| Final full suite with local loopback access: `npm test` | 523 | 0 | 0 / 0 | `verification-production-final.txt`; 21,172.1269 ms |

Final relevant totals: **590 passed, 0 failed, 0 skipped, 0 cancelled**, across two distinct suites. The earlier environment-blocked attempt is retained rather than omitted. It did not justify production changes. These totals certify local engineering behavior, not semantic accuracy or championship success.

Tests exercise all six required keys and types, malformed/duplicate/overflow JSON, probability/selection consistency, semantic contradictions, honest incomplete support, exact Unicode source binding, document and scene changes, source reversal epochs, forged identity, unchanged B payloads, raw preservation, negative coverage, deterministic candidate provenance, BM25 reference arithmetic, escaping and network-free preparation. Test responses are explicitly named structural doubles, not fake Clocked recordings. No sealed scenarios or semantic answer key were used.

## Exact new files

No existing file was modified. All additions are below `experiments/p0b/`:

| File | Purpose |
|---|---|
| `contract.mjs` | Frozen six-field contract, policy, titles, canonical fingerprints |
| `tasks.mjs` | Pure exact-source v1/v2 request preparation and freshness checks |
| `decoder.mjs` | Strict text response schema and semantic consistency checks |
| `candidates.mjs` | Deterministic human-unconfirmed source-bound candidates |
| `baseline.mjs` | Frozen standard BM25 configuration and implementation |
| `development.mjs` | Only the four named exposed U01 probes and AI-off comparison |
| `view.mjs` | Escaped isolated preparation/candidate presentation |
| `prepare.mjs` | No-argument offline artifact writer, no dispatch capability |
| `stage0.test.mjs` | 67 local engineering tests |
| `prepared/contract.json` | Frozen contract definition |
| `prepared/baseline.json` | Frozen lexical configuration |
| `prepared/development-probes.json` | Exact input snapshots, four B/C bodies, AI-off rankings/rules |
| `prepared/manifest.json` | Source, contract, baseline, task and request fingerprints |
| `prepared/index.html` | Readable offline prepared-probe view; no provider results |
| `verification-stage0.tap` | Passing isolated test output |
| `verification-production.txt` | Retained environment-blocked regression attempt |
| `verification-production-final.txt` | Passing final production regression output |
| `STAGE0_REPORT.md` | This handoff and limitations |

## Reproduce on Windows without Clocked

From `C:\Users\HP\beforeroll-codex-phase1`:

```powershell
node --test experiments/p0b/stage0.test.mjs
node experiments/p0b/prepare.mjs
npm test
```

Preparation must match the existing freeze or fail closed. Inspect `experiments/p0b/prepared/index.html` as an ordinary local file; it does not start the application, execute scripts or contact a provider. All historical raw Clocked evidence and the current production UI remain separate. There is no `--live` or blind-input command. Do not delete/replace frozen files to bypass a mismatch; diagnose and obtain a separately approved version instead.

**Stop point: Stage 0 only.** Four exposed development probes prepared, zero sent. Stage 1/2 execution, any new results, production migration and autonomous handling are not authorized or performed. No competition PASS or sponsor-value gain is claimed from this preparation.
