# Fixture journey acceptance run

13 September 2026. Windows, Node 24.20.0, npm 11, in-app Chromium browser; fixtures `cavite-demo-v1`, contract `0.2.0`. Revision: the commit containing this report (`git log -1 -- docs/acceptance-run.md`). This is the fixture gate, not ML validity or production readiness.

`npm run check`: 24 passing tests, TypeScript/lint/build and 11 fixture scenarios. API tests use real authenticated sessions and SQLite. Browser checks used fictional local accounts.

| AC | Result / scope | Evidence |
|---|---|---|
| 01 | Pass, fixture catalog/manual | Browser search by year, browse brand/model/year/variant, no-match then minimal manual save; API unknown brand/year remain null and fuel unavailable |
| 02 | Pass | Default vehicle restores on reload; defaults editable; explicit preference endpoint checked |
| 03 | Pass | Field errors retain values; API rejects unresolved/same endpoints, spoofed ownership and incompatible fuel before persisting analysis |
| 04 | Pass, illustrative map | Two radio-selectable routes, metrics and labeled fictional schematic; no preference-mode gate |
| 05 | Pass | Browser/API: 2.5 L × 78 = 195; bounds 179.40–210.60 |
| 06 | Pass | Brand B cost 200, bounds 184–216, same liters and recommendation |
| 07 | Pass | Alternative +7 min and 15.60 less at brand A; keyboard selection; recorded recommendation unchanged |
| 08 | Pass | One-second delay, brand changed while pending: response discarded, no save control; reanalysis returns current values |
| 09 | Pass, approximate handoff | Planned trip saved before Maps link. Actual Google Maps Directions opened; its routes are independent of fictional alternatives |
| 10 | Pass | Failed-save UI gives error/no link; retry saves. API identical sequential/simultaneous retries return same trip; selection conflict gives 409 |
| 11 | Pass | Seven API plans, latest-five/full list; new app instance reads retained SQLite data. Browser detail retains original vehicle/price after inputs/defaults change |
| 12 | Pass, fixture | All degraded API scenarios; browser stale/manual unavailable/source/time observed. No missing-value zero substitution |
| 13 | Pass, simulated provider | Browser one/no-route and map-disabled states; API timeout/unknown traffic. Not a live-provider test |
| 14 | Pass at tested browser widths | At 1280/360 CSS pixels, document widths 1265/345 with scrollbar: no overflow. Planner/results inspected; native select, Enter and Space actions exercised. Physical phone/screen reader remain future checks |
| 15 | Pass for implemented endpoints | Real A/B sessions deny foreign garage/analysis/trip reads/writes consistently; cross-origin and unauthenticated calls rejected |
| 16 | Pass | Synthetic/unvalidated notice, fixture source/method and demo ranges; no accuracy claim |
| 17 | Pass | Injected clock: expired unsaved analysis -> 410; saved retry returns original snapshot |
| 18 | Pass, local API target | 30/30 requests; p50 1.57 ms, p95 2.13 ms in recorded run. Excludes network/browser/live APIs; reruns print current metrics |

## Handoff clarification

Two explicit steps: save the plan, then activate the returned same-tab Maps link. This avoids blocked new-window behavior observed in the test browser. Back returns to the app; trip status remains planned. The [official Maps URL interface](https://developers.google.com/maps/documentation/urls/get-started) receives origin/destination, not an invented route ID or fictional waypoint. The preview is a labeled illustrative schematic.

## Review limits

Independent agents completed collaborator setup and initial UI markup/styles, but usage limits prevented final independent review. The lead integrated and exercised the result; this is not a separate reviewer sign-off. No physical mobile device, screen reader, live provider, trained model, statistical calibration or measured fuel accuracy was tested. No participant study began.
