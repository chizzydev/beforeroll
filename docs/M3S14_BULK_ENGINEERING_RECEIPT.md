# BeforeRoll M3-S14 — PDF text provenance and scene authority integration

## Scope
Increment from accepted M3-S13 (Windows 166/166). This is product functionality,
not a GUI redesign or deployment/submission phase. All existing research data,
original Clocked response fixtures and frozen U01/U02 graders are retained.

## Implemented
- Native Node conservative PDF parser for **original text-based PDF** inputs only.
  Validates classic cross-reference locations, object generation/offsets, page tree,
  one bounded stream per page, known Type-1 base font, supported text operators,
  simple horizontal top-to-bottom placement and optional deflate compression.
  Does **not** claim to parse arbitrary PDFs. Scanned, embedded-font, rotated,
  nonlinear, annotated, encrypted, interactive, visually complex, and
  unsupported-layout PDFs fail closed; no OCR and no external dependencies.
- Preserve actual original input byte SHA-256, explicit reconstructed Unicode
  text SHA-256 and a page/stream-to-normalized-text span map.
- A **mandatory human PDF transcription verification** with reviewer, rationale,
  original raw-byte and exact-text fingerprints must be saved before PDF source
  participates in any Clocked planning or execution. Unreviewed PDF appears
  in Production Desk as blocked; model is not silently permitted to use it.
- For same normalized text but different original file bytes, require a distinct
  document ID instead of silently transferring prior source/authority evidence.
- Immutable, human-recorded exact source-unit-to-scene applicability register:
  RESTRICTION / CONDITIONAL_GRANT_CLAIM / REQUIREMENT / REQUEST_NOT_GRANTED /
  CONFLICT_OR_UNCERTAIN / BACKGROUND_CONTEXT, with explicit scope and rationale.
  A binding includes exact current source quote offsets/hash and call-sheet row
  hash; revisions mark existing assertions stale while retaining history.
- Local loopback HTTP routes: `/api/workspaces/:id/pdf-transcription`,
  `/scene-authority` GET/POST with optimistic version and source identity fences;
  integrated local Production Desk controls for PDF review and scene authority.
- Owner storage validates scene assertions on save/load; paginated projections.

## Independent scope and honesty
- Automated tests must pass. Legacy 166 tests retained, new S14 tests include
  real synthetically authored PDF byte structures, Flate streams, page mapping,
  malformed/unsupported formats, human review gate, CRUD, source invalidation,
  version fencing, browser controller, production overview, zero provider calls.
- U01 and U02 original scored owner-recorded evidence is read-only: each 5/5.
- This **does not** demonstrate arbitrary real-world PDF document coverage,
  legal signature/authority verification, or successful production Clocked calls.
- Human-reviewed source transcription is a statement about the reviewer checking
  text extraction only; it never establishes legal authority or permitted filming.

## Next meaningful increment
Multi-day/overnight timezone-aware operations, condition deadlines and scene
prerequisites with comprehensive source-bound project overview and export.
The later complete-product UI/UX redesign and end-to-end owner GUI acceptance
remain deferred at the user's request.
