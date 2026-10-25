# M3-S30: Isolated, no-credential interactive evaluation — engineering record

**Scope:** User-directed evaluator usability engineering and browser-first owner tests.
This does not replace the planned final UI redesign, public demo hosting, or full product validation.

## Behavior

- New Windows double-click entry point `Start-BeforeRoll-Evaluation.cmd` creates an independent Node process on a freshly chosen loopback port and automatically opens the system's default browser. The Windows PowerShell script only starts/stops the server; the operator does not have to enter commands, tokens, credentials, or secrets.
- `node server.mjs --evaluate` is an explicit alternate process mode. It generates a private temporary store **not** under the installed owner's persistent project directory.
- Generated, fictional U01/U02 permit and call-sheet originals are seeded into the same native persistent-project and SHA-256-addressed original-file mechanisms as real owner projects. U01's original owner-recorded eight answers are seeded; U02 can be replayed explicitly via its in-browser action. Existing project workbench supports viewing current evidence, adding human reviews, navigating stages, source-change previews and local dossier exports.
- Both original response sets are mapped ONLY to identical scene rows and identical quote text. They carry `OWNER_RECORDED_DIFFERENT_REQUEST_CONTRACT` provenance and the original request hash. They MUST NOT be construed as having been freshly returned for the newer source-bound production request contract. The production execution summary remains marked `notClearance`.
- Browser visible notices state FICTIONAL, NO KEY, NO LIVE, RECORDED, NOT CLEARANCE. Owner records cannot be reached from evaluation endpoints. The embedded owner mode remains token-gated.
- Live APIs remain disabled even if process environment includes Clocked credentials; all experimental live routes answer disabled. Replay endpoints reject changed source content and calls involving other projects. Reset discards ONLY the temporary evaluation store.
- Loopback, same-origin, forwarded-host, and local owner request checks continue to apply. **Not a remotely accessible hosted demo.** A later public deployment requires an independent per-session isolation/security review.
- Do not import confidential documents into the sample sandbox. The working sandbox is unencrypted and disposable; source originals are owned by the local evaluation process.

## Verification

- Seven focused evaluation/security/integration tests; existing S29 owner privacy suite unchanged.
- Cumulative Node regression suite, real recorded frozen U01/U02 source read-only scores, file inventory SHA-256 and clean ZIP extraction verify.
- Local HTTP tests establish no owner data shared, independent sample workspace, no authentication, no provider calls, replay identity and provenance, reset isolation, cross-origin rejection, source-change mismatch rejection.
- Actual Chromium GUI screenshot check was attempted but the tool environment blocked browser navigation to local HTTP addresses (`ERR_BLOCKED_BY_ADMINISTRATOR`). Do not claim GUI acceptance. Windows owner should conduct a single coordinated browser exploration from the launcher after the automated gate.

## Known bounds

1. Node.js 20+ is required on the evaluator's PC.
2. Only the owner's local machine's browser can access its launcher (`127.0.0.1`), not a public website.
3. The evaluator mode does not contact Clocked live; imported or edited projects have no fresh semantic evaluations. The original two frozen source pairs are the only valid recorded replay pairs.
4. Concurrency and true cross-platform GUI handling remain for coordinated product acceptance.
