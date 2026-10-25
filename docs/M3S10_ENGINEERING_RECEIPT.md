# BeforeRoll M3-S10 — durable local production intake (bulk engineering)

## Accepted input boundary / scope
M3-S9 Windows acceptance (104/104) preceded this work. M3-S10 deliberately extends the same unified workspace and source-audit pipeline. It **does not** replace every legacy Review Desk behavior or purport to have completed the product.

## New working engineering capabilities
- `src/source-intake.mjs`: verifies byte identity, strict UTF-8 decoding and optional BOM; supports plain UTF-8 `.txt/.md` permit text, typed permit `.json`, RFC-4180-style call-sheet `.csv`, typed call-sheet `.json`, and explicit valid pipe-text scene sheets. No silently skipped CSV rows or invalid scene clocks; preserve raw-source hash + normalized-source hash and record CSV row lineage.
- `src/production-workspace.mjs`: provenance-backed imports to the same production documents/call-sheet state, selective stale assessment invalidation, review history and source integrity assertions.
- `src/workspace-store.mjs`: durable atomic versioned per-user workspace JSON, storage integrity hash, optimistic concurrency, single-writer interprocess lock and no automatic lock recovery after crashes. Original sources retained locally, no API credentials stored.
- `src/workspace-location.mjs`: stable Windows `%LOCALAPPDATA%\\BeforeRoll\\Workspaces` directory (or explicitly set absolute `BEFOREROLL_DATA_DIR`), independent from extracted release folder. No silent workspace disappearance on next package upgrade.
- `server.mjs`: strictly local offline `api/workspaces` project create/list/read/import/review/plan. Route disabled if the host binds publicly. No billable calls. Existing replay APIs and M3-S9 planning remain untouched.
- `scripts/workspace-cli.mjs`: complete offline owner command-line flow for creating, importing, inspecting and task-planning a production; same validated importer and versioned storage as the HTTP API.
- `scripts/Verify-M3S10.ps1`: a single ASCII-only PowerShell 5.1 verification gate: cumulative Node tests, frozen preregistration and both unchanged original U01/U02 5/5 evidence checks. No GUI sessions and no Clocked requests.

## Integrity invariants
- Fail on malformed CSV quoting, duplicate scene IDs, malformed clock values, unexpectedly shaped JSON, unsupported file formats, binary inputs, spoofed names, invalid UTF-8 and source integrity failures. No source omission or made-up model outputs.
- Existing frozen U01/U02 JSON evidence, request hashes and preregistered thresholds are preserved byte-for-byte.
- All source permissions remain subject to human authenticity, signer, scope, precedence, scene conditions and legal/documentary verification.
- Persistent workspace endpoints are **local owner tools**, not authenticated multi-user production services. No public network binding for these routes.

## Deferred to substantial engineering increments, not incorrectly claimed as implemented
- Direct PDF/DOCX text extraction (especially scans, layout and tables) is **NOT** included. These formats are explicitly rejected rather than fabricating text. A trustworthy documented PDF extraction subsystem with reviewable page-to-source provenance is required next.
- The imported workspace is not yet surfaced through the complete unified browser Review Desk workflow. That connection remains the next bulk integration, alongside multi-scene checkpointed live execution over the actual imported projects.
- Cross-process crash after provider dispatch remains a billing-unknown stop requiring deliberate review. No automatic resend.
- A full Windows GUI acceptance and final UI redesign are intentionally deferred until the functional product is complete.

## Verified locally
- Node 22 full suite: **120/120 PASS; zero failed**.
- M3-S6 frozen source preflight and owner-recorded U01/U02 each remain 5/5.
- No external npm packages or network access required.
- No new paid Clocked calls.
