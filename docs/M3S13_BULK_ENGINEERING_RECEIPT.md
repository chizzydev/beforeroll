# BeforeRoll M3-S13 — Document intake and source-linked authority workflow (2026-10-25)

## Owner process
The prior M3-S12 Windows owner gate passed with 150/150 Node tests, frozen U01 and U02 each 5/5, original U03 offline-only preflight. This is **one substantial functional increment**, not a user-facing redesign. No Windows GUI screenshot acceptance until the integrated product is complete.

## Built in this increment
- Genuine `.docx` permit import using only Node core: validate ZIP central directory, CRCs, path names, encryption status, archive size, source XML, no external relationships, no macros. Extract ordinary Word main-body paragraphs and table cells; preserve original imported **byte SHA-256**, normalized text SHA-256, Word part digest and Unicode source map for quotations.
- Fail closed on unsupported revision markup, tracked changes, hidden text, embedded resources, comments, hyperlinks, field code, footnotes, drawings, merged tables, etc. No claims of visual reading order, legal completeness, or OCR.
- Human-entered documentary provenance: stable document, role (`PERMIT`, `AMENDMENT`, `REQUEST`, etc.), reference, issuer and issued date (all *unverified claims*), reviewer and reason. Tied to the current source revision.
- Immutable, exact-source-anchored documentary graph with `AMENDS`, `SUPERSEDES`, `REFERENCES`, `REQUESTS_VARIATION` and `CONFLICTS_WITH`. Exact quotation/codepoint offsets, source identities and reviewer rationale are retained. Source revisions make historical links **STALE** instead of applying them to new bytes; cycle/duplicate protection rejects invalid claims.
- Unified Production Desk controls, local project API (`/api/workspaces/:id/authority`, `/authority-document`, `/authority-link`), optimistic version conflict checks and durable state. Owner data is loopback-only. Global body size remains capped; DOCX import alone gets its needed bounded base64 limit.
- Underlying model tasks, Clocked durable execution checkpoint identity, historic owner evidence and pre-registered frozen scientific assertions untouched. No new provider calls during development.

## Independent gates
- Automated Node suite: **166/166 PASS** (prior 150 + 16 new).
- New checks: good DOCX, raw SHA/normalized quote offsets, plain and table XML, corrupt ZIP CRC, ZIP traversal, external relations, unsupported revision components, truthful PDF rejection, immutable original quotation, role annotations, archived stale relationship, forged identities, mixed edge cycles, version conflicts, browser controller integration, and persisted API.
- Frozen U01 / U02 independent original scorers: **5/5** each. Synthetic-only model accuracy claims.
- Source ZIP manifest, fresh clean extraction and Windows native execution verification separate gates.

## Known limits and next functional bulk work
- PDF/A scanned OCR PDF imports are **not yet** supported; no pretend parsing. DOCX importer intentionally rejects complex markup rather than dropping permit terms.
- Authority graph records what a responsible human asserted, not legal effect, and does not automatically override model judgments. Exact scene scope, signer authority, date/precedence and contradictory documents still need human validation.
- Continue larger product integration in future substantial builds: PDF text extraction with strict source alignment/uncertainty review, cross-document/scene authority inference and richer operational scheduling; then coordinated complete-product GUI/UX verification and redesign.
