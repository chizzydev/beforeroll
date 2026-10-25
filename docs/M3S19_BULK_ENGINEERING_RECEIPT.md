# BeforeRoll M3-S19 — source-bound review sessions, committed atomically

Baseline: owner-accepted M3-S18 v0.16.0 (258/258 Windows automated tests). This is
cumulative engineering **without a final visual redesign or GUI acceptance**.

## What was actually connected

The existing scene workbench and source-review plan can stage individually reasoned
human decisions for up to 64 exact source tasks across documents and scenes. The
review-session preview derives from the **same current signed-by-checksum integrated
dossier** as the action queue, workbench and evidence export. Each preview exposes
its source quote, document/scene/Clocked-request identities, previous human decision,
new action and planned update count. Preview is strictly read-only and uses no model.

A separate explicit commit recomputes that entire exact preview against the still-
current project version, source plan and original as-of instant. It mutates a clone
of the existing workspace via ordinary `recordReview`, checks source, authority,
scene authority and operations integrity, then uses the existing atomically written,
optimistically versioned workspace repository. Duplicate, unknown, outdated,
malformed or altered task decisions fail closed. No additional mutable review store.
No-op sessions do not create spurious version increments or duplicate history.

The browser controller exposes staging from either the exact scene task or the
source review plan, source-specific typed rationale, preview totals, individual
unstaging and explicit atomic commit. Source revision and workspace switching
invalidate pending browser sessions. All accepted decisions are reflected by the
current scene packet, derived action queue and integrated dossier.

## Technical surfaces

- `src/review-session.mjs`: validate + preview + revalidate + cloned batch commit.
- `POST /api/workspaces/{id}/review-session/preview` (local, zero writes).
- `POST /api/workspaces/{id}/review-session/commit` (exact preview digest + as-of,
  strict version fence; single durable project persist).
- `public/workspace-desk.mjs`: one staged-human-review flow in current scene view.
- `tests/m3s19-review-sessions.test.mjs`: direct, HTTP and browser-controller tests.

## Tests and limits

281 automated tests (258 baseline + 23 new), no Clocked provider requests.
Read-only scoring on original U01/U02 is included in owner Windows verification.
This batch only addresses **human source-task decisions**; it does not automatically
close model findings, documentary conflicts, operational prerequisites, or missing
source checks. The user must still explicitly review each source and supply its own
rationale. No signature authentication, legal approval, filming permission, model
accuracy or full product completion is claimed.
