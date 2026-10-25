# M3-S25 / Practical Document Handling & Original-Correction Integrity

## Scope and accepted basis

Built cumulatively from the exact M3-S24 v0.22.0 source package. **M3-S24 was not separately reported as Windows-accepted in the originating conversation** before this engineering increment. M3-S25 Windows verification is cumulative; do not convert independent Linux/Node tests into a Windows owner gate by assertion.

M3-S25 closes practical gaps in document intake WITHOUT claiming full OCR, PDF semantic layout analysis, automatic transcription completeness, document authenticity, or legal permission.

## Supported workflows

- **Simple PDF:** The previous conservative strict text extractor remains first and its output still requires owner comparison before Clocked analysis.
- **Complex PDF with text layer:** If the owner explicitly configures `BEFOREROLL_PDFTOTEXT_PATH` to the absolute path of a trusted local Poppler `pdftotext` executable, and the conservative parser cannot read the PDF, a bounded, no-shell, no-network text-layer extractor is attempted. It records page-associated codepoint offsets, rejects an empty/scanned page or malformed UTF-8, and is always HELD for human transcription verification. The external tool is **optional and is not bundled**. Output from a PDF text layer is not a visual-layout completeness guarantee.
- **Scanned or otherwise unsupported PDF permit:** The owner can select the exact original in the production's existing source import, tick human-reviewed transcription, provide page/section/table-located source passages, explicit section count, named reviewer and full-source attestation. Original binary SHA-256 and normalized text SHA-256 remain distinct. No OCR or guessed content.
- **Complex DOCX permit:** The original DOCX must pass bounded, CRC-checked OOXML ZIP structural validation; macro-enabled, embedded executable objects, external relationship targets and ZIP path ambiguity remain rejected. Owner-reviewed sections are supported even if images/drawings prevent automatic text extraction. Existing conservative automatic paragraphs, internal hyperlink-visible text and ordinary tables remain available.
- **PDF/DOCX call-sheet assistance:** Read-only `POST /api/workspaces/:id/document-preview` offers extracted reference text and strictly literal provisional rows if available. It writes NOTHING and cannot bypass explicit human-reviewed original call-sheet scene-count attestation. Image-only originals fall back to a complete human-reviewed scene register. DOCX originals with ordinary image media can now enter that fallback, but not macro/external-link-containing packages.
- **Correct imported source text:** Selecting the EXACT original binary together with a corrected human transcription supports the SAME existing source-change preview, source fingerprint and explicit commit workflow. Changes to normalized source meaning retire affected Clocked tasks and human review currentness without destroying the original file or history. Attempting to commit a different original or transcription than previewed fails.
- **Dossier/recovery:** Reviewed permit attestation identity, page locators and cryptographic *checksums* of section text appear in evidence dossiers, with explicit non-independent status. Full attestation and immutable original binary are retained in local source custody and portable backups.

## Key invariants

1. Model analyses still require the exact human-reviewed accepted current source. No model calls are made by PDF/Word extraction, inspection, correction or preview.
2. Read-only document preview never creates a scene, a review decision or an API attempt.
3. Unsupported document formats or absent optional tools receive actionable manual-transcription guidance, not silently stripped clauses or invented scenes.
4. A hash is a content identity, NOT evidence that the human transcription is accurate or complete. The only completeness claim is the identified human reviewer's unverified attestation.
5. All new output is local owner-only. No external service is contacted by the application during these flows (other than an explicitly configured, locally installed executable processing local bytes).
6. No cloud account, signature authentication, OCR, automatic multi-column reading order guarantee, or legal/filming clearance was added.

## Tested

- Complete existing cumulative Node test suite and new document/recovery tests, including generated real PDF fixtures (two-page text-layer and genuinely image-only).
- Optional PDF converter success, failure, malformed UTF-8, scanned-page rejection, and owner-only no-shell contract.
- Corrupt Office ZIP, macros, external relations, embedded objects, ordinary visible internal hyperlinks, and image-backed Word fallback.
- Local HTTP imports/previews and private binary retrieval; browser-controller import and draft-preview actions; full-source revisions; source fingerprint and historical plan retirement; dossier and recovery.
- The original U01/U02 owner-recorded Clocked assertions remain a **separate fixed synthetic test**, not a claim of real-world accuracy.

## Owner gate

Run `scripts/Verify-M3S25.ps1` from any working directory after extracting this release; it checks exact distribution hashes, Node syntax, all tests, frozen source preflight, and the two original frozen Clocked read-only scorecards. No GUI and no Clocked API key are necessary. If the optional Poppler tool is not installed on the Windows machine, that is expected: the human-reviewed fallback is a first-class workflow.
