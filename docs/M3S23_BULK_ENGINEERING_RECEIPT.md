# BeforeRoll M3-S23 — Whole-production source revision reconciliation (v0.21.0)

## Baseline and purpose

Owner's accepted M3-S22 Windows gate: **347/347 PASS**, frozen original U01 and U02 **5/5 each**. Those owner recordings remain unchanged. This release is a substantial functional integration across the already-built document, Clocked journal, human-review, scene authority, scheduling, and original-file custody systems, **not** the final visual redesign or an end-to-end GUI acceptance.

Prior to this increment, the source preview showed high-level plan task counts, but did not give an operator a consistent explanation of which downstream human claims or scene plans would become historical. Moreover, the browser's Preview then Commit action simply imported a file against the old project version: the server did not enforce that the committed file was the one the operator actually previewed.

## Implemented change: one source update, one coherent production reconciliation

`src/source-change-control.mjs` now derives before/after impact by running the **existing exact import procedure** on a cloned workspace. Its read-only result covers, without creating any independent persistent projection:

- Per-scene **retired, added and retained source-bound Clocked task identities**, with deterministic per-scene counts and bounded samples.
- Distinct scenes newly introduced, removed and retained in the replacement call sheet.
- Human task review records that are no longer current for exact retired task identities; prior decisions remain in history.
- Documentary amendment / conflict / reference links whose original evidence becomes historical, compared by exact link identity (not misleading net count).
- Scene-specific authority claims that become historical when a document or scene row changes; old claims that become source-current again are also separately identified.
- Human-dated scene schedules that must be reconfirmed after scene source changes.
- Operational prerequisites that lose their current source/scene validity.
- Original-byte fingerprint of the proposed imported file, existing import history, source id and optimistic project version.

The preview includes a reproducible SHA-256 over its complete structured result (`previewSha256`). The new owner-private `POST /api/workspaces/:id/commit-source-change` recomputes the same preview **using the exact supplied bytes**, requires the same `previewSha256`, and refuses source-identity no-ops. Version checks run before any commit. The owner browser now routes its visible **IMPORT EXACT PREVIEWED FILE** action through this server verification, and requires a preview before replacing an existing original via its ordinary permit/call-sheet import buttons. No Clocked requests occur in preview or commit.

The same single versioned workspace remains the authoritative source; no second state store or copied model inference is introduced. Source history and exact original bytes remain under the existing source vault and portable lifecycle backup. Old model journals continue to be archived by original source-plan identity and never reauthorized after a revision.

## Engineering proof and exact limits

- 21 new automated tests cover deterministic preview hashes, original source immutability, document link staleness, source-bound human task history, scene claims, scene schedule reconfirmation, conditions, scene removal, per-scene added/retired tasks, explicit new-document addition, source identity no-ops, altered file/name/version rejection, browser preview->commit, source mutation after preview, same-origin rejection, persistence, original-file custody and zero-provider-call path.
- Cumulative test target: **368/368 PASS** (347 previously accepted + 21 new). Independent original U01/U02 read-only scores and U03 preflight are checked again in Windows gate.
- This owner-guided exact preview/commit route does **not** remove the older explicit `/import` API, needed for existing backwards-compatible owner automation and import flows. It is **not** a universal account-authorization boundary. Project storage stays loopback-only; the user must not expose it as an unauthenticated public service.
- Human-reviewed PDF/DOCX call-sheet transcription has its own original-source attestation process, unaffected by the ordinary text/CSV change-preview workflow.
- Comparisons describe **source evidence changes**, not legal validity, document authenticity, completed obligations, or permission to film. An unchanged task identity does not certify substantive safety.
- No GUI acceptance or new real Clocked provider score is asserted.

## Owner gate

Run `scripts/Verify-M3S23.ps1` from any PowerShell current directory, after extracting the versioned ZIP into Downloads. It independently validates **all** distributed source file SHA-256 hashes, JS syntax, the cumulative offline suite, original source preflight, and both original owner-recorded Clocked scorecards. Expected final line: `M3S23_WINDOWS_OWNER_AUTOMATED_GATE=PASS`.
