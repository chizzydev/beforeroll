# M3-S22 — Reviewed PDF/DOCX Call-Sheet Originals (v0.20.0)

## Accepted baseline

M3-S21 v0.19.0: Windows owner **323/323 PASS**. Frozen original U01/U02 owner-recorded Clocked evidence and U03 preflight remain unchanged. The experiment's score bands are not generalized model accuracy.

## Cohesive functional addition

Film coordinators often receive call sheets as original PDFs or Word files, sometimes scanned or with layouts our strict extractor cannot safely interpret. The earlier workflow only accepted CSV, typed JSON or a pipe-format text scene register. This increment provides a **single project workflow** that retains actual PDF/DOCX call-sheet binaries while allowing a responsible human to enter a complete, source-referenced scene register. The user must enter every scene, identify original page (PDF) or table reference (DOCX), declare the total scene count, provide a reviewer and an explicit verification basis, and affirm completeness.

The application validates binary structure conservatively, file size and exact SHA-256, strict row normalization, time format, duplicate scenes, minimum page/table references and owner attestation. The source-intake receipt cryptographically binds the exact uploaded file **identity** to the human-entered normalized scenes and the reviewer identity. It **does not claim** the binary independently proves the human transcription; no OCR, semantic reading or document authentication takes place.

All verified file bytes join the M3-S21 content-addressed original store and portable backup/recovery. The normalized scene register joins the SAME existing production workspace, downstream multi-scene plan, durable execution, action queue, scene workbench and dossier. Editing rows produces a new scene source revision, with previous assessment history preserved. A differently hashed PDF with unchanged normalized rows cannot silently replace an earlier source provenance receipt.

The owner-private browser Production Desk now contains a PDF/DOCX original input, transcribed row editor, explicit original row count, source references, reviewer, verification note and attestation checkbox. The owner HTTP route is `/api/workspaces/:id/call-sheet-transcript`. The dossier/Markdown and production scene view distinguish **HUMAN-TRANSCRIBED / NOT INDEPENDENTLY SOURCE-VERIFIED** from machine-extracted source material. Old CSV/JSON/txt import remains supported and unchanged.

## Validation and limitations

- 24 focused new tests cover accepted PDF and actual structurally checked DOCX binaries, source references, omissions and forged metadata, malformed file/text and clock failures, repeat imports, source revisions, source tampering, real local owner HTTP, browser-controller action, persistence, original-byte retrieval, and portable recovery.
- Cumulative suite: 347/347 PASS locally (323 accepted baseline + 24); U01/U02 original frozen source/evidence scorer must be rerun independently in Windows gate.
- No paid Clocked calls in automated test, no public deployment and no Windows GUI acceptance.
- PDF binary check is limited (PDF header and EOF marker). This does not verify original page count or compare image/table contents to owner-entered text. The owner MUST review original pages; a false attestation is not detectable by code.
- DOCX original uses the conservative checked reader and rejects unsupported/macro/external-relationship content; some legitimate complex documents cannot be imported this way.
- No account-based access control; local owner workspace remains loopback-only. No automatic filming clearance or legal authority inferred.

**Next:** Continue functional closure and independent end-to-end workflow validation. The complete UI/UX redesign remains separately deferred by owner instruction.
