# Current implementation status

Updated 13 September 2026. This page supersedes historical foundation-only statements. The local fixture journey is implemented; the thesis and live/ML validation are not complete.

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

Read [CONTRIBUTING](../CONTRIBUTING.md) and [team workflow](team-workflow.md). CI, a PR template and reviewed dependency-update configuration are included. Friend access needs their exact GitHub username and accepted invitation. Branch protection is a remote setting, not established by these files. Check CI execution on the submitted revision.

## Research and remaining scope

Cavite first; approximately 12 October 2026 submission; ML required. The [actual VED sample audit](ml-data-audit.md) found sparse/zero fuel-rate data: this is not training-ready. Next inspect label semantics and static-feature mapping; D08–D11 stay unresolved. No trained model or live provider is connected. A fixture demo alone does not satisfy the ML thesis requirement.

Physical mobile testing, participant consent/retention, verified email/recovery, hosting, live pricing/routing permissions, status/measurement collection and held-out ML evaluation remain future gates. Use fictional local accounts. Earlier foundation snapshots were documentation milestones; this work does not retroactively claim they were tested.
