# M1 Windows owner acceptance — CSP-safe visual correction

**Only the fictional recorded demo. No Clocked API calls.** Keep the previous M0 directory unchanged. Stop the old server with Ctrl+C before starting the new copy.

1. Run `npm test` in the new `BEFOREROLL_M1_CSP_SAFE_VISUAL_FIX_v0_1_1` project folder. All 19 baseline and 4 new timeline tests should pass.
2. Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-BeforeRoll.ps1`. Open `http://127.0.0.1:3000`; force-refresh with Ctrl+F5 if needed.
3. Click Scene 15. **The timeline must show a visible lime-to-coral bar from 16:05 to 17:20**. A coral vertical marker must be placed at **17:00**, roughly two-thirds of the 13:00–19:00 track, *not at its left edge*. The top legend says **DOCUMENTED CUTOFF 17:00**.
4. Compare scene-row mini bars: Scene 14 (35 minutes) should be visibly shorter than Scene 15 (75 minutes).
5. Confirm source inspector **Filming exceeds documented 17:00 cutoff** highlights `17:00` and identifies the call-sheet Scene 15 row. Check Scene 16 still flags West Plaza and drone operation.
6. Source intake > LOAD VARIATION V-9 > Review desk > Scene 23. Check the time axis includes the later 20:10–20:45 planned scene and no clipped/false 13:00 position. Variation scope remains a human-review question, not authorization.
7. Source intake > alter the documented text > APPLY TEXT / CLEAR OLD EXTRACT. With no trusted cutoff, the UI must not draw an **ISSUED** cutoff line based on an unverified value.
8. Optional: Browser F12 Console must not contain **Refused to apply inline style because it violates Content Security Policy** when using this new version.

Owner screenshots prove visible behaviour, not correctness of Clocked, legal permit validity or full product acceptance.
