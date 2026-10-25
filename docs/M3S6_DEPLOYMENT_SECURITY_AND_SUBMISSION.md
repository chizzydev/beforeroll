# BeforeRoll M3-S6 — deployment and submission safety contract

This release does **not** deploy anything. The tested local server uses Node 20+, no third-party packages. Its live mode sends the server-resident Clocked key to `https://clocked.rezolve.ai/clocked/decide`; it must not be publicly exposed without additional security and operational controls.

## Local install

`npm test`; `node scripts/evaluate_m3s6.mjs --preflight`; `powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\Run-BeforeRoll.ps1'` (Windows). `node server.mjs` is the same offline mode on other systems. Live requests require `-Live`, terminal-entered Clocked API key, and a separate operator token. Never publish `.env`, API key, operator token or bearer-auth logs.

## Safe judge demo proposal

Host the **offline/recorded** Node server only. A service such as Railway or Render could run `node server.mjs` with `HOST=0.0.0.0` and `PORT` assigned by the provider; record the actual deployed URL only after verifying it works. Set **no** `BEFOREROLL_LIVE_ENABLED=true`, `CLOCKED_API_KEY` or `BEFOREROLL_OPERATOR_TOKEN` environment variables on the public instance. Check `/api/health` returns `liveEnabled:false`, that billable POST requests return 503, and no secrets are present in browser assets. Run on fictional sources only; there is no account-level access restriction and no general secure storage.

Do not equate a locally working server with a deployed demo. Deployment, uptime, public UX checks, GitHub publishing and challenge submission are still owner actions. Do not add a real customer's permit or identifiable crew records to the public demo.

## Security gaps to close before any genuinely live internet-facing version

Strong user authentication and access control; CSRF/origin and abuse protection; dedicated server-wide billed-usage limits; rate controls across replicas; key storage and rotation; audit trails and data retention; protected data handling; formal privacy review and consent; issuer/authenticity verification policies; accurate UI for unknown billing; and independent threat modeling. The local operator token is a **pilot safeguard**, not production authentication.

## Submission release checklist

1. All frozen M3-S6 fixtures, scientific expectations, provenance labels and model test results correct; no false claims for U01/U02 if untested.
2. Windows owner UI and exported dossier checked. If live case tested, original JSON independently scored and archived with hashes; false positives retained.
3. Automated suite passes; package ZIP and manifest match; fresh extraction tested. No `.env` or secrets in repository.
4. Public recorded-only demo + public GitHub source + judge video actually accessible; independent browser smoke and no live key in page bundle.
5. Official entry's **write-up field** contains complete substantive product explanation and why Clocked is essential, instead of only a link. Optional votes are irrelevant to Best Overall judged criteria.
6. Submit before official cutoff and preserve submission receipt. Recheck date, timezone, judging and platform requirements on the official sponsor page.

**Status: NOT DEPLOYED, NOT SUBMITTED.**
