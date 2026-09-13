# M1 deterministic fixture inventory review

Proposal for M1.4, based on foundation AC01–AC18 and contracts v0.1. No application behavior has been implemented or tested by this review. Fixtures demonstrate behavior and cannot establish prediction accuracy, price coverage, or traffic validity.

## Bounded dataset and controls

- Fixture version: `thesis-demo-v1`; namespace all record IDs with `fx-`. Use a resettable seed and injected clock, initially `2026-09-12T00:00:00Z`. Document the fixture clock in evidence; do not show it as today's observed price.
- Users: A (primary owner) and B (isolation adversary), plus an anonymous session. Use reserved `.example` addresses. Development credentials are generated locally, never privileged/shared production credentials. Maintain both clean-onboarding and returning-user seed profiles; AC01 starts with A's garage empty.
- Vehicles: fictional brand **Demo Motors**, **Demo Commuter 2024 Base MT** and **Demo Commuter 2024 Plus AT**, both gasoline with synthetic specifications and explicit fixture provenance. Different variants exercise disambiguation. Rated economy may be null; demo route estimates are authored fixtures, not calculations purporting to describe these vehicles. A saved minimal manual **My Unlisted Vehicle**, gasoline, has null unknown specifications and no estimator support.
- Fuel choices: **Demo Fuel One** (78.00 PHP/L) and **Demo Fuel Two** (80.00 PHP/L), fictional brand IDs; one explicit synthetic gasoline grade. A wrong-fuel diesel observation and a wrong-grade observation are decoys that must not match.
- Origin/destination: two synthetic named locations, plus an alternate destination for stale-response tests. Coordinates are valid and visibly synthetic. Own authored preview polylines; no external map tiles/provider payload are needed for fixture assertions. A separate openly identified Maps demo destination is selected by the lead for real desktop handoff verification; the fixture is not evidence of a drivable route or real traffic.
- Routes: `fx-route-a`, 30,000 m / 2,100 s / 2.5 L [2.3,2.7]; `fx-route-b`, 28,000 m / 2,520 s / 2.3 L [2.1,2.5]. Route A is fixture-designated recommended; explanation says this is an authored demo tradeoff. Traffic-aware status represents a simulated fixture, with clear demo provenance. All range kinds are `demo`, coverage null.
- History: returning profile has seven A-owned planned trips with unique timestamps, newest-first ordering, and two B-owned records. All snapshots are synthetic. The primary journey adds an eighth A record. No real personal locations or fuel reports enter seed data.
- Analysis IDs and trip IDs are deterministic per test reset but each new analysis invocation receives a distinct sequence ID. Inject time for expiry; do not use real sleeping. Failure controls belong in the test/development harness, never unauthenticated public request fields.
- Fixture-only policies: choose a versioned time-to-live (suggested 15 minutes) and fixture freshness window (suggested 24 hours), explicitly limited to test scenarios. These are not a resolution of live-provider D13 freshness policy. Provide separate fresh, stale-unusable, and unknown-age observations.

## Scenario inventory

| Scenario | Fixture mutation / action | Expected invariant | Acceptance |
|---|---|---|---|
| FX01 Onboarding | Clean A; search `Demo Commuter 2024`, browse same catalog; save Base | Distinct variants; exact chosen specs; owned garage entry; no unrelated profile fields | AC01 |
| FX02 Manual fallback | Query `No Such Vehicle`; submit minimal manual vehicle | Visible fallback; catalog ID null; unknown specs null; owned save succeeds; liters and cost unavailable | AC01, AC12 |
| FX03 Returning defaults | Returning A, two garage records; switch vehicle/brand | Default and explicit preference behavior stable; in-place changes use new analysis inputs | AC02 |
| FX04 Invalid inputs | Missing each required field, unresolved endpoints, out-of-range coordinates | Field errors preserve other values; adapter invocation count remains zero; no analysis saved | AC03 |
| FX05 Two routes | Standard Base vehicle, Demo Fuel One, resolved endpoints | One recommendation, two comparable results and owned demo preview; A cost 195.00 [179.40,210.60], B 179.40 [163.80,195.00] | AC04–05 |
| FX06 Brand switch | Same route/vehicle input except Demo Fuel Two | All fuel values unchanged; A cost 200.00 [184.00,216.00] | AC06 |
| FX07 Alternate selection | Choose B from FX05 | +7 min, PHP 15.60 less; B selected, A still recommended | AC07 |
| FX08 Out-of-order response | Hold request 1 via controllable promise; edit destination; complete request 2 before request 1 | Request 1 never overwrites request 2; outdated result cannot masquerade as current; new analysis ID | AC08 |
| FX09 Save and handoff | Save FX07 then open external URL | Exactly one planned trip; selected-price and route/vehicle snapshots present; valid encoded allowlisted Maps URL; save precedes opening | AC09 |
| FX10 Save failures | Fail before commit, then retry same key | No false saved state; no external opening before commit; eventual one trip | AC10 |
| FX11 Lost response / duplicate | Commit then simulate dropped response; retry and concurrent identical save | Same trip ID, one owner+analysis record; no duplicate analysis-time snapshots | AC10 |
| FX12 Conflict | Same key/different selection; then different key/same saved analysis/different selection | Respective idempotency and selection conflicts; original selected route unchanged | AC10 |
| FX13 External failure | Save succeeds, opening fails; retry link | Saved trip remains; no second save needed; status stays planned after returning | AC10 |
| FX14 Immutable history | Mutate current quote to 80.00 and change default after FX09 | Saved quote stays 78.00 with original dates and selected B; latest five only on dashboard, all eight A records in full history; B records absent | AC11 |
| FX15 Price fallbacks | Isolate compatible station, area, broader brand, then general quote candidate sets | Priority follows contract among usable observations; geography/fallback explicit; general observation has null brand ID; wrong-fuel/grade decoys never selected | AC12 |
| FX16 Stale/missing price | Freshness clock makes quote stale-unusable; no fallback; repeat absent quote | Fuel stays available; cost and selectedPriceSnapshot null; reason visible; rejected observation's date/source can appear as warning context, not usable quote | AC12 |
| FX17 Ranged price | Only compatible 76.00–80.00 PHP/L source range; no derived point-price method | A cost envelope 174.80–216.00; expected cost null; no midpoint implied, no probability claim | AC12 |
| FX18 Unsupported predictor | Manual vehicle, valid routes and compatible quote | Numeric fuel/cost null with reasons; no fuel-based Smart Recommendation; route-only information remains | AC12 |
| FX19 Route cardinality | One-route response, then zero-route response | One real fixture candidate without padded alternatives; zero routes is structured NO_ROUTES with no recommendation | AC13 |
| FX20 Provider timeout | Adapter throws controlled transient timeout; next invocation succeeds | Retryable structured failure preserves inputs; no fake result or silent demo substitution | AC13 |
| FX21 Missing traffic/preview | Traffic unaware/unknown; broken owned preview | No live traffic claim; textual result/selection usable without preview; failure does not erase metrics | AC13 |
| FX22 Keyboard/mobile | Execute FX01/05/07/09/14 at 1280px desktop and 360px mobile | Labeled controls, visible focus, announced states, non-color selection and no critical overflow | AC14 |
| FX23 Ownership | Real server sessions A/B/anonymous; B references A garage/analysis/trip IDs, including save references | Consistent private-object denial; no B-created trip based on A analysis; anonymous denied; A remains authorized; stub auth cannot pass | AC15 |
| FX24 Provenance | Render and save available fixture records and derived cost | Sources retain fixture origin; cost derivation names fixture inputs; persistent unvalidated labels and null nominal coverage | AC16 |
| FX25 Expiry | Advance injected clock past unsaved analysis TTL; repeat for saved FX09 analysis | Unsaved first save returns ANALYSIS_EXPIRED; identical saved retry returns existing trip without refreshing dates/price | AC17 |
| FX26 Timing | Thirty standard FX05 runs with reset documented, without failure/delay injections | Report all outcomes and p50/p95; suggested nearest-rank p95 is sorted observation 29; do not replace errors with successful reruns | AC18 |

## Evidence and remaining lead decisions

Each run should record scenario ID, acceptance IDs, fixture version, commit, clock/configuration, environment, observed result and evidence reference. This is a proposed inventory, not completed acceptance evidence. Snapshot assertion must inspect embedded price values; checking a mutable ID alone is insufficient.

AC16 allows fixture **or** mixed mode, so M2 can use only fixture and derived-from-fixture provenance. Do not label synthetic records `observed` merely to simulate mixed live provenance; genuine observed integration belongs to M3 with source evidence. FX24 should prove derivation preserves its fixture lineage.

Lead must freeze: fixture TTL/freshness test policies; resolved demo locations and explicit Maps demo destination; whether stale observations are always unusable in M2; inputSnapshot fields and manual-entry handling; exact startup/reset commands and local authentication setup. No decision here chooses a final ML algorithm, interval method, route score, study region or live price policy.
