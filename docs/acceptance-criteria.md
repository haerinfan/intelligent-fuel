# First complete trip-planning journey acceptance criteria

Defined before implementation on 2026-09-12. Current results are in [acceptance-run.md](acceptance-run.md); the original criteria are retained below. This is the M2 fixture workflow gate, not proof of research validity. Requirements FR/NFR are in requirements.md. The map is an explicitly illustrative schematic; handoff saves first, then exposes a same-tab Maps link. Physical mobile verification stays in M3.

## Test setup

Use isolated test accounts A and B, owned synthetic records and deterministic fixture adapters. Include two clearly fictional vehicle variants, at least seven saved trips for A, a two-route success case, one-route and zero-route cases, compatible exact-price quotes of 78.00 and 80.00 PHP/L, stale/missing/ranged price cases, unsupported prediction and simulated save/provider failures. The synthetic fixtures must not be attributed to a manufacturer or real station. Stubbed authentication alone cannot establish AC15; ownership needs an actual server/session path by M2.

The primary successful journey is sign up/log in → select a vehicle → submit origin/destination/brand → compare two routes → choose an alternative → save planned trip → open Maps → return and inspect history. A test records observed values and a saved record, not just screenshots.

| ID | Given / action | Required observable result | Trace |
|---|---|---|---|
| AC01 | New user A signs in and selects a specific catalog variant through search; repeat through browse and then a no-match query | Model/year/variant are distinct; known specs load; vehicle is saved and planner opens without unrelated profile questions. No-match visibly offers manual fallback; a minimal manual vehicle can be submitted and saved, with unknown specs preserved and prediction unavailable unless supported | FR01–04 |
| AC02 | Returning A opens planner and changes vehicle or brand | Defaults load; controls remain editable in the planner; preference changes are explicit | FR05, FR16 |
| AC03 | A submits missing or unresolved endpoints, missing vehicle or brand; then corrects them | Field-specific errors retain valid values; invalid analysis does not reach the adapter; submitted result uses resolved input snapshot | FR05, FR17 |
| AC04 | Valid two-route fixture is analyzed | One demo recommendation and one alternative show map preview, distance, duration, expected liters/range, expected cost/range, price basis and explanation; no pre-analysis preference mode | FR08–10 |
| AC05 | Quote is 78.00 PHP/L and A route fuel is 2.5 L, range 2.3–2.7 | Raw expected cost 195.00 and bounds 179.40–210.60; displayed rounding is consistent and never feeds stored calculations | FR07, NFR03 |
| AC06 | Same route/vehicle receives alternate quote 80.00 PHP/L | Fuel remains 2.5 L and 2.3–2.7; expected cost becomes 200.00 and bounds 184.00–216.00 | FR07, NFR03 |
| AC07 | B route is seven minutes longer and 2.3 L at 78.00; user selects B | Comparison shows +7 min and PHP 15.60 less; selection is accessible; A remains the recorded recommended route | FR09, FR11 |
| AC08 | User edits an input while analysis is pending or after results | Old response cannot overwrite the new input state; old results are marked outdated and cannot save as the changed trip; reanalysis produces new ID | FR17–18 |
| AC09 | User activates Open in Google Maps on B | Save succeeds first; one planned trip contains §9 fields and original versions; returned URL encodes the intended destination and practical route data; status remains planned | FR11–12 |
| AC10 | User double-clicks, loses first save response, or retries after external opening fails | Identical requests return the same trip; no duplicates. Failed save never claims success or opens Maps. Saved trip survives opening failure; retry link works. Conflicting selection is explicit | FR12, NFR04 |
| AC11 | A returns and opens saved detail after default vehicle and current quote change | B remains selected, A recommended; original permitted price/vehicle/estimate snapshots and timestamps remain unchanged; dashboard shows latest five; full history has all seven+ | FR12–13, FR18 |
| AC12 | Show stale/general-fallback/missing/ranged prices and unsupported vehicle prediction | Source, price location, observation date and freshness are visible. Fallback is named. Missing cost/liters are unavailable, never zero. A ranged report is not silently converted to an official point quote | FR03, FR06–07, FR17 |
| AC13 | Routing returns one/no route, times out, lacks traffic, or map preview fails | One route is not padded with fake alternatives; no route means no fake recommendation; timeout preserves inputs and offers retry; traffic limitations are named; textual results remain usable without map | FR08–09, FR17 |
| AC14 | Execute complete journey by keyboard at desktop and on 360px mobile | No critical overflow; visible focus, labeled inputs, announced status/errors; route choice does not rely on color; values and actions available outside map | NFR01 |
| AC15 | B guesses A's garage, analysis and trip IDs on read and write endpoints | Server denies access consistently; no details leak; A can still access its own records. No privileged secrets in browser output or Git | NFR02 |
| AC16 | Inspect results and saved details in fixture or mixed mode | Persistent demo/unvalidated labels near numeric outputs; provenance distinguishes each source; no claimed model accuracy or calibrated coverage | FR19 |
| AC17 | Try an expired unsaved analysis; retry an already saved analysis after expiry | Unsaved analysis requires reanalysis. Identical retry of saved analysis returns existing trip. Dates and price freshness cannot be silently refreshed | FR17–18, NFR04 |
| AC18 | Execute 30 fixture analyses on recorded environment | Report p50/p95 and failures; proposed p95 target ≤2 seconds. A failure is logged as a failed target, not hidden through selective runs | NFR06 |

## Maps verification boundary

M2 tests URL encoding and opens a clearly identified demo handoff destination. A mock navigation callback is insufficient to claim external handoff was tested. Record actual desktop behavior; perform mobile URL behavior checks by M3. Show “Google Maps may update this route.” Returning from Maps never proves the trip occurred. No real driving is needed for these checks.

## M2 exit evidence

Keep an acceptance run table with date, environment, commit, fixture version, result and evidence for AC01–AC18. Include browser evidence and relevant API/database assertions. All required criteria must pass or remain explicitly blocked; do not call the journey complete with unresolved save, ownership or calculation failures. UX wording can say demo range; validated “likely range” is reserved for the later research gate.

## Later acceptance gates

- M3: demonstrate permitted live routing, compatible observed pricing or explicit unavailability, attribution, field-level retention policy and actual mobile/desktop Maps behavior. No live-to-demo fallback without visible consent/labeling.
- M4: Yes/No/Dismiss follows D07, actual fuel is optional and unverified, history filters work, and participant-data handling follows D12. Status corrections with existing measurements require a documented rule.
- M5: agree the research protocol, establish a baseline, evaluate on held-out measured data, and separately report fuel error, interval coverage/width, recommendation outcomes and usability where relevant. Metrics are proposed evaluation dimensions; targets and methods remain deferred. If no trustworthy fuel labels exist, explicitly limit conclusions to the demonstrated scope.
