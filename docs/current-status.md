# Current implementation status

Updated 14 September 2026. This page supersedes historical foundation-only statements. The fixture journey is implemented and synced to GitHub; the thesis and live/ML validation are not complete.

## Ready locally

- Maintained email/password authentication, per-database rate limiting and cookie sessions.
- Responsive planner, searchable/browsable synthetic catalog, manual fallback, multiple saved vehicles and explicit defaults.
- Validated resolved demo locations, synthetic routes/prices/estimates, exact decimal cost, and unavailable/stale/ranged/general-fallback states.
- Private per-user garage, analyses and trips; transactional idempotent saves, selection conflicts and analysis expiry.
- Immutable historical vehicle, price, estimate and recommendation snapshots, latest-five/full history, and save-before-Maps handoff. Same-tab Maps link and browser Back; fictional alternatives are not real Google geometry.
- Input changes discard old pending responses. Demo controls exercise delay, save failure and textual map fallback.
- Contract 0.2.0 fixes manual unknowns, quote compatibility and saved-snapshot integrity.

Run `npm ci`, `npm run setup`, `npm run check`, then `npm run dev`. Open `http://127.0.0.1:3000`. Credentials and SQLite stay local and ignored. The browser uses native HTML/CSS/ES modules against the TypeScript API; no second frontend server or build is required.

## Verification and collaboration

24 tests pass, plus lint, types, 11 fixture scenarios and build. See [acceptance evidence](acceptance-run.md) for desktop/360px, keyboard, delayed responses and actual Maps navigation. These are local fixture measurements, not live-provider performance guarantees.

Read [CONTRIBUTING](../CONTRIBUTING.md) and [team workflow](team-workflow.md). CI, a PR template and reviewed dependency-update configuration are on GitHub. [Windows and Linux CI passed](https://github.com/haerinfan/intelligent-fuel/actions/runs/34797476946) on `5e13437`, after fixing browser-source checkout line endings. Friend access needs their exact GitHub username and accepted invitation. Branch protection is a remote setting, not established by these files.

## Research and remaining scope

Cavite first; approximately 12 October 2026 submission; ML required. The [initial sample audit](ml-data-audit.md) and [label/static follow-up](ml-label-feasibility.md) are complete. All populated raw fuel rates in the inspected week are PHEV; ICE labels need a justified derivation. Next specify units, retained-window targets and quality rules before training; D08–D11 stay unresolved. No trained model or live provider is connected. A fixture demo alone does not satisfy the ML thesis requirement.

Physical mobile testing, participant consent/retention, verified email/recovery, hosting, live pricing/routing permissions, status/measurement collection and held-out ML evaluation remain future gates. Use fictional local accounts. Earlier foundation snapshots were documentation milestones; this work does not retroactively claim they were tested.
