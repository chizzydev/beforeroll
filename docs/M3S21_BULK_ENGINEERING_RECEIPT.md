# BeforeRoll M3-S21 — exact-source original custody, legacy relink, portable binary recovery

## Baseline

Owner accepted **M3-S20 v0.18.0: 306/306 Windows tests PASS**, plus independently frozen U01 and U02 (5/5 each). M3-S21 retains that source and the original owner-recorded Clocked receipts unchanged; these are NOT generalized model-accuracy claims.

## User problem addressed

Earlier imports preserved original file SHA-256, reconstructed text, Unicode spans and provenance, but discarded exact uploaded **PDF/DOCX/CSV/TXT/MD/JSON bytes**. Consequently, a portable project restore could recover the model journal and text but not reopen the actual original permit or call sheet. A human verifying an imported PDF cannot use a normalized transcript alone as the original artifact.

## Completed functional engineering

1. Every **new accepted project file upload** is retained in a private immutable, SHA-256 content-addressed store under the local owner's workspace data folder. Validation uses exact uploaded bytes, including BOMs, original newlines and PDF/Word binary structure. Files are never overwritten or deleted automatically on revisions.
2. Original retention is coupled to the actual versioned import route. Invalid or conflicting imports are rejected without replacing a saved project; a stray unreferenced blob after a failed commit is not treated as current source evidence. The exact project source receipt continues to be the authority for blob identity.
3. An owner-private original-file register identifies exact bytes present/missing, and byte-identical downloads are possible only for hashes referenced by the selected production. Project originals are not statically served on the public app.
4. A legacy-original **relink** accepts owner-supplied original bytes ONLY if their SHA-256 and byte count equal an existing historical import receipt. It changes no workspace source, revision, human finding or model journal and makes zero Clocked requests. Previously accepted project imports are not silently backfilled; the owner must supply those originals when needed.
5. A complete owner lifecycle backup now embeds exact original files from the vault (including still-referenced historical imports) alongside the original workspace and ALL provider journals. Archive validation verifies each embedded byte string, byte count, SHA-256, reference set, declared missing set, and cross-system integrity. Portable recovery writes validated original blobs before revealing the recovered project.
6. Original retention and recovery are **fail-closed** on corrupted files, unexpected symlinks and byte/hash conflicts. Dedicated 8 MiB/file and 32 MiB/backup embedded-original budget bounds stop enormous payloads rather than silently omit files. The original register can still identify available files beyond the backup budget.
7. Previous v0.18.0 backups without embedded original bytes remain verifiable/recoverable, and missing preexisting originals are **explicitly reported**, not misrepresented as present.
8. Production Desk presents a simple original custody count, exact-file download links and a SHA-bound legacy relink control. This is functionality hooked into the current temporary UI, **not** the requested final product redesign.

## Verification and limitations

- Cumulative offline Node suite: **323/323 PASS** in development (306 accepted baseline + 17 focused new tests).
- Original frozen U01, U02 and U03 files and scorer unchanged; owner Windows preflight checks separately.
- 17 new tests cover byte identity, original-file tampering, historical revisions, portable backup/recovery, checksum/coverage forgery, legacy formats, HTTP origin guards, relinking, zero source-version changes, and recovery authorization.
- This does **not** establish permit authenticity, legal authority or filming clearance. File hashes are integrity evidence only and cannot prove what authority issued the document.
- The vault is local owner data. It has no public login/multi-user authentication and must never be mounted on an Internet-exposed server.
- If the backup exceeds the stated raw-byte archive cap, the command fails explicitly. Keep originals separately or partition the project rather than discarding historical artifacts.
- Original bytes are not backfilled from other versions automatically. They are unavailable unless imported after M3-S21 or explicitly relinked by hash.
- No actual provider requests, final browser/GUI acceptance, external-user acceptance or final visual redesign is claimed by this incremental gate.

## Continue

Advance the remaining functionality in substantial increments, then conduct the agreed unified end-to-end GUI/real-provider acceptance and the separate UI/UX overhaul. Do not declare the product complete solely on a growing test count.
