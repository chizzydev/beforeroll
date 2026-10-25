# M1 independent visual verification (CSP-equivalent local browser harness)

- Baseline: M0 Windows owner screenshot shows Scene 15 label correctly but its timeline bar missing, and 17:00 vertical cutoff at extreme left; scene list mini bars were all near-full width.
- Root cause: `server.mjs` sends strict `Content-Security-Policy: style-src 'self'`. Chromium blocks HTML inline `style=` attributes. M0 rendered time positions as inline attributes in `public/app.js`. This explains the precise owner symptom.
- M1: removed **all** dynamically templated `style=` attributes. Visual CSS is in external first-party `public/styles.css`; only positioning percentages are applied with vetted JS `HTMLElement.style.left` / `.width` setters after DOM render. The CSP header remains unchanged.
- JS browser visual test: Chromium 1150px viewport with CSP-equivalent meta directive and first-party stylesheet preloaded. Scene 15 timeline bar measured x=51.385% of track, cutoff x=66.623%, bar width >75px. No inline-style CSP violation messages. All three scene mini bars render proportional widths.
- Warehouse late scene axis includes 17:00–23:00 and does not clip 20:10–20:45 into a 13:00–19:00 axis.
- Browser testing caveat: the sandbox blocked navigation to the real HTTP localhost server; app JS/engine/fixtures were combined in a local browser harness with mocked fixture fetches and the same strict style CSP rule. Server static routes and headers were separately verified with Node tests. Full browser-over-HTTP owner confirmation on Windows remains required.
- Browser screenshot from harness: `docs/M1_CSP_SAFE_OWNER_PREVIEW.png`.
- This is a UI geometry regression fix only, not independent validation of film permits.
