# Final public release verification — 28 October 2026

This is the current documentation/distribution correction above public RC1 `790dd27b2a5e74c5f05f10478c6ab9e1017d11de`. The final commit is identifiable in normal Git history by `release: finalize BeforeRoll documentation and public demo`; a manifest cannot contain its own future commit hash. No prior published commit is rewritten.

## Scope

The README now explains the real coordinator problem, complete Last Light result, Decide/Extract/Fill composition, same-receipt comparison, architecture, authority boundaries, local setup, actual controls, verification and limitations. The completed [demonstration](https://youtu.be/Ng_lMzWNlTs), public repository and owner-confirmed Windows acceptance replace obsolete current-guide status. Official competition submission remains separate; no hosted application URL is invented.

Current guide/checklist/submission copy/security/development documents are reconciled. The [documentation index](../README.md) distinguishes current guidance from historical reports. Five redundant early plans/console receipts/harness files are removed, with exact local copies and prior Git versions retained. The U01 accepted JSON moves byte-identically out of `_codex_mission` to `fixtures/audit/U01_ACCEPTED_EVIDENCE.json`; its verifier changes that path and replaces its stale acceptance-status diagnostic with `NOT_MEASURED_BY_THIS_OFFLINE_VERIFIER`. Assertions remain unchanged. The embedded historical README gets relative-link repairs without changed historical claims.

The original RC1 manifest is preserved byte-identically under `verification/releases/RC1_RELEASE_MANIFEST.json`. The new root inventory and offline `scripts/release/verify-distribution.mjs` check current content; the joined public gate invokes it first. No application, UI, test body, provider contract, frozen source, gold, recording or execution fence changes.

## Verification receipts

- Initial corrected public gate: **661/661 native PASS**, 28,006.6469 ms; **109/109 frozen PASS**, 9,249.5252 ms. Zero failures, skips or cancellations. Source/receipt and recording preflights passed.
- Corrected distribution in an independent base clone: **661/661 native PASS**, 28,140.1331 ms; **109/109 frozen PASS**, 9,710.0439 ms; zero failures/skips/cancellations. The corrected packet was copied byte-for-byte into the clone, including inventory; committed-source clone and remote readback are separately required before final publication PASS.
- Source/evidence baseline comparison: **380 application/test/contract/fixture/campaign files byte-identical** to RC1. Moved U01 evidence and preserved RC1 inventory are byte-identical.
- Recording SHA-256 remains `2cc34e798efe694df045418082e29f8b6c3b5b35f600f4167305a9ce5cc30954`: 23 genuine historical calls/62 credits, six prerequisites/two investigations. Prior 39-request and 57-request campaigns remain closed.
- The 14 original-to-public mapped commits retain author/date/message. Reachable history remains the audited derivative, with a normal documentation commit added; excluded other-product research images remain absent.
- Current tree, reachable Git objects and decoded JSON base64 fields are scanned for configured credentials, common token patterns and private backup/store paths. No values are printed. This is a bounded audit, not universal secret detection or historical screenshot OCR.
- Mermaid was successfully rendered to SVG before publication. README images are accepted original screenshots. All **82 local Markdown links**, including two README anchors, pass; three accepted screenshot hashes match. The historical `.png` filenames contain valid JPEG bytes; the original bytes/names are retained and browser decoding is checked. historical snapshot manifests retain their historical paths.
- Public YouTube metadata resolves to the BeforeRoll demonstration. Signed-out in-app browser playback was observed at **2:37 / 6:19**; the video is **unlisted and accessible by link**. No full-video privacy certification is inferred from this spot check; the owner accepted the finished video.
- Actual in-app browser against the unchanged public Evaluation: S31 five prerequisites plus CS-9 investigation; exact LENDER/U001 codepoints `[0,391)`; return to scene; S32 venue officer plus unissued request with no handling-task transfer. The visible Fill qualification remains.
- Evaluation terminal shutdown reports zero provider calls and temporary-data disposal. U01/U02 remain in the same runtime and full isolation/historical regressions.

Independent Windows acceptance is owner-confirmed, not claimed as a new agent GUI session. The private archive-only assertion remains intact locally, outside the 661 public scope. No fresh provider requests, credits, deployment, new license, tag/release or competition submission occur in this correction.

Detailed machine receipts, original removed bytes and browser screenshots are retained in the protected local `release/Final-Release-Audit-20261028/`, not included wholesale in the public source. Current file hashes are reproducible from the root manifest; published commit identity is available directly in GitHub history.
