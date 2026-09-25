# Data contracts

Version 0.2.0, implemented fixture API. Runtime schemas are in `src/contracts/index.ts`; handlers are in `src/trip-api.ts`. Changes go through the lead and decision log. Statistical method and predictor features remain deferred. The fixture implementation notes below supersede the original proposed endpoint names.

## Implemented fixture interface

All `/api/v1` data endpoints require a verified cookie session; mutations require the configured same origin. Ownership comes from the session. Request objects reject unexpected fields.

| Endpoint | Input / output |
|---|---|
| GET /api/v1/bootstrap | `{catalog, locations, brands, scenarios, notice, schemaVersion}`; the bounded catalog is searched/browsed in the client |
| GET /api/v1/garage | `{vehicles, preferences}`; saved vehicle `{id, vehicleSnapshot, createdAt}` |
| POST /api/v1/garage | `{catalogVehicleId}` or `{manual:{label,fuelType}}` (known gasoline/diesel or null) -> `{vehicle}` |
| GET, DELETE /api/v1/garage/:id | Owned record / deletion; historical snapshots remain intact |
| PATCH /api/v1/preferences | Optional `defaultVehicleId`, `brandId`; referenced vehicle must be owned |
| POST /api/v1/analyses | Core analysis request plus `scenario` and optional `simulateDelay`; returns `{analysis}` |
| GET /api/v1/analyses/:id | Owned `{analysis}` |
| POST /api/v1/trips | `{analysisId,selectedRouteId,simulateFailure?}` -> `{trip,mapsUrl}`; no separate idempotency header needed |
| GET /api/v1/trips | Optional limit 1–100; no limit returns all local prototype plans; `{trips}` |
| GET /api/v1/trips/:id | Owned `{trip,mapsUrl}` |

Manual snapshots have `kind=manual`, label in `model`, and null catalog fields; catalog snapshots have `kind=catalog`. Manual prediction is unsupported in this version. Saved trips retain `analysisCreatedAt`, `recommendationSnapshot`, warnings and all route/price/vehicle snapshots. For early local development records missing the additional metadata, parsers expose unknown/null values rather than invent history.

Trip uniqueness is owner+analysis, enforced transactionally and by a database unique constraint. Identical retries return 200 and the original trip; a first save returns 201; conflicting selection returns 409 `SELECTION_CONFLICT`. Expired unsaved analyses return 410. A simulated save error returns 503 `DEMO_SAVE_FAILURE` without a write. The delay/failure fields are bounded, clearly exposed fixture controls. Live-provider retention, paginated/searchable catalog, advanced history filters and measurement/status endpoints below remain proposals for later milestones.

## Conventions

- Opaque string IDs; ISO 8601 UTC timestamps; local dates rendered for the selected study locale.
- Distances are meters, durations seconds, fuel liters, currency PHP and prices PHP/liter. UI displays km and minutes without changing stored units.
- Use decimal arithmetic for cost. Decimal quantities travel as strings; round only for display. Example `"2.5" × "78.00" = "195.00"`.
- Missing values are null with a reason, never zero. All positive numeric inputs reject NaN, infinity, negatives and malformed decimal strings. Coordinates must be finite and within latitude/longitude bounds.
- IDs and ownership are checked server-side. Schema version is included in responses and saved snapshots.
- Provenance records `mode: fixture|observed|user_reported|derived`, `sourceName`, optional `sourceUrl`, `observedAt`, `retrievedAt`, `sourceVersion` and `retentionPolicyId`. Fixture records say fixture even when mixed with live records.

## Entities

| Entity | Required core fields | Nullable / optional fields and rules |
|---|---|---|
| ResolvedLocation | label, latitude, longitude, resolutionSource | providerPlaceId only when available and permitted; all fixture coordinates labeled synthetic |
| VehicleVariant | id, market, brand, model, modelYear, variant, vehicleClass, provenance | displacementCc, transmission, fuelType, compatibleGrades, ratedKmPerLiter; source evidence must support the exact variant/year |
| CatalogSourceRecord (staging proposal) | market, brand, model, variant, sourceName, sourceUrl, retrievedAt, reviewStatus | source version/date/hash; modelYear, vehicleClass, displacementCc, transmission, fuelType, compatibleGrades, ratedKmPerLiter and test method; unknown evidence remains null and cannot be normalized to VehicleVariant |
| SavedVehicle | id, ownerId, entryMode (`catalog` or `manual`), displayName, specificationSnapshot, isDefault | catalogVariantId null for manual entry; at most one default per owner. No fabricated fallback economy |
| FuelSelection | brandId, fuelType | gradeId nullable only if compatibility and quote semantics allow it; ambiguity must be resolved before price matching |
| PriceObservation | id, fuelType, currency=`PHP`, unit=`PHP_PER_LITER`, geographicBasis, geographyLabel, observedAt, retrievedAt, provenance | brandId null only for disclosed general fallback; gradeId, stationId; amount exact or lower/upper range (see below) |
| SourcePriceRecord (staging proposal) | sourceName, sourceUrl, sourceFileSha256, sourcePage, reportPeriodStart/End, monitoredFrom/ThroughDate, retrievedAt, province, cityMunicipality, fuelType, gradeId, reviewStatus | brandId; lower/upper/common PHP per liter; sourceMarker; reviewer metadata. This record cannot enter cost arithmetic until visually verified and normalized under D13 |
| RouteCandidate | id, label, distanceMeters, durationSeconds, trafficStatus, calculatedAt, provenance | geometry/previewRef and providerRouteId ephemeral unless retention permits; trafficStatus=`aware|unaware|unknown` |
| SelectedPriceSnapshot | observation (embedded PriceObservation), freshness, freshnessPolicyVersion, selectionPolicyVersion, matchedAt | An immutable copy of quote values, geographic basis, provenance and dates, not a live ID lookup |
| FuelEstimate | status=`available|unavailable`, methodId, methodVersion, validationStatus=`fixture|unvalidated|validated` | expectedLiters, range, reason; unavailable implies both numeric fields null; available requires an expected value or a labeled usable range |
| CostEstimate | status=`available|unavailable`, currency=`PHP`, calculationVersion | priceObservationId nullable when no usable quote; expectedPhp, rangePhp, reason; available requires at least an expected value or range; unavailable implies both numeric fields null |
| Analysis | id, schemaVersion, ownerId, createdAt, expiresAt, inputSnapshot, routes, recommendation, warnings | selectedPriceSnapshot nullable when no usable quote; provider content subject to expiry; not automatically a planned trip |
| PlannedTrip | id, ownerId, analysisId, createdAt, inputSnapshot, recommendedRouteId, selectedRouteId, routeSnapshots, status, schemaVersion | selectedPriceSnapshot copied from analysis (nullable if unavailable); recommendation ID nullable in degraded route-only cases; promptDismissedAt, handoffRequestedAt; fields retained only where permitted |
| FuelMeasurement | id, tripId, reportedLiters, reportedAt, methodDescription, verificationStatus=`unverified|accepted|rejected` | measurementStart/End, evidenceReference, protocolVersion, verifiedAt; default unverified, never automatically training eligible |

Minimum manual vehicle entry: display label and known fuel type, with optional known year/variant/specs. Fuel prediction remains unavailable unless the active estimator explicitly supports those inputs. The manual form does not define the final ML feature set.

Manufacturer research is staged separately from the runtime catalog. `CatalogSourceRecord` may retain a null model year and other unknowns while evidence is reviewed. Promotion to `VehicleVariant` requires exact-year/variant support for every populated field; a current sales page or brochure upload date cannot silently become `modelYear`. See [the Philippine vehicle source spike](../docs/vehicle-source-feasibility.md).

## Price matching and range semantics

Price lookup receives fuel selection, explicit price location and analysis time. Proposed initial price location is the origin area (D19); display that basis. Exact/nearby brand station → brand city/area → broader brand average → general fallback, considering only compatible and usable observations. No cross-fuel or undisclosed cross-brand substitution. Freshness is `fresh|stale|unknown` based on a versioned source-specific policy, not retrieval time alone. Freshness limits are open in D13.

DOE PDF publications require a staging layer because they provide monitoring date intervals rather than timestamps. Preserve the source file hash, page, report period, monitoring interval and retrieval time before normalization. Treat blank, `None`, `No LFRO` and `0.00-0.00` as unavailable in the proposed adapter. See [the Cavite source spike](../docs/fuel-price-source-feasibility.md). D13 must define the timestamp and freshness policy before a staged record becomes a runtime `PriceObservation`.

An exact observation carries `amountPhpPerLiter`. A source range carries `lowerPhpPerLiter` and `upperPhpPerLiter`; it must not be silently converted to an official midpoint. A point estimate requires a disclosed derived price method. Without one, expected cost is null while an explicitly labeled cost envelope may be available. No usable price produces cost unavailable, not PHP 0.

Fuel range: `{ lowerLiters, upperLiters, kind, nominalCoverage }`, where `kind=demo|heuristic|calibrated`. Nonnegative lower ≤ expected ≤ upper when all exist. A validated interval must cite method/version and validation evidence; `nominalCoverage` stays null for demo/heuristic bands. If an estimator has an expected value but no defensible interval, range is null with an explanation; it cannot pass the eventual research-range criterion simply by inventing a band.

For exact price p and liters [l,u], cost bounds are [l×p,u×p], expected cost e×p. If both fuel and price are ranges, nonnegative endpoint products give a cost envelope; that envelope has no claimed probability coverage without later justification. Costs exclude tolls and non-fuel expenses.

## Original proposed API surface (future names/features, not current handlers)

Authentication transport is selected in M1. Every private endpoint requires an authenticated session. Do not accept authoritative ownerId in client requests.

| Endpoint | Request | Success / invariant |
|---|---|---|
| GET /api/v1/vehicles | q or browse filters, cursor, limit | Variant page with provenance; explicit empty results |
| POST /api/v1/garage | catalogVariantId or manual specification, isDefault | Owned saved vehicle; default updated transactionally |
| GET /api/v1/garage | — | Owned saved vehicles and default |
| POST /api/v1/analyses | origin, destination, savedVehicleId, fuelSelection, priceLocation | Analysis snapshot with route results and individual provenance |
| POST /api/v1/trips | analysisId, selectedRouteId; Idempotency-Key header | Saved planned trip and handoffUrl; one trip per owner+analysis |
| GET /api/v1/trips | cursor, limit, dateFrom/To, vehicleId, destination, status, hasActualFuel | Owned paginated history; dashboard requests limit=5 |
| GET /api/v1/trips/{id} | — | Original permitted snapshots; never today's recomputation |
| PATCH /api/v1/trips/{id}/confirmation | response=yes/no/dismiss | Status transition below; no automatic measurement |
| POST /api/v1/trips/{id}/measurements | reportedLiters, methodDescription, optional supporting metadata | Unverified report; permitted for taken trip only in proposed M4 flow |

`Analysis.routes[]` contains `{ route, fuelEstimate, costEstimate }`. `recommendation` contains `{ status: available|unavailable, routeId, methodId, methodVersion, reasonCode, explanation }`. In the fixture journey, a pre-authored fixture recommendation has a demo reason. An unavailable recommendation has null routeId and an explicit reason. It may not masquerade as a Smart Recommended Route.

`PlannedTrip.routeSnapshots[]` copies the permitted `{ route, fuelEstimate, costEstimate }` values and versions from that analysis. `selectedPriceSnapshot` embeds the exact source observation and matching metadata; never resolve historical money amounts by dereferencing a mutable price ID. Every available cost references this snapshot's observation ID. Any provider-mandated expiry follows the persistence permission contract and is displayed explicitly.

The handoffUrl is constructed server-side from permitted values for an allowlisted Maps destination, never from an arbitrary client redirect URL. Include practical route-defining waypoints only where supported. UI states that Maps may change the route.

## Idempotency and state

Trip uniqueness is `(ownerId, analysisId)`. The first successful save fixes selectedRouteId. Repeated identical requests return that trip, including when the first response was lost. Same idempotency key with a different payload returns `IDEMPOTENCY_CONFLICT`; an existing analysis saved with a different selection returns `TRIP_SELECTION_CONFLICT` rather than silently rewriting history. User can run a fresh analysis to create a distinct planned trip. This proposed scope avoids an unrequested route-edit workflow.

Before the first save, expired analysis returns `ANALYSIS_EXPIRED`; user reanalyzes. After save, an identical retry can retrieve the existing trip even if the transient analysis expired. Input changes require a new analysis and new key. A deliberate new analysis may create a new trip even for the same endpoints.

```text
analysis ready → user chooses route → save pending → planned trip saved → handoff requested
                               save fails ↘ retry (same key)
planned --Yes--> taken
planned --No--> not_taken
planned --Dismiss--> planned (record prompt dismissal only)
```

Maps opening/closing and returning to the app do not change status. D07 is the proposed reconciliation of guide §§10–11. Later user corrections between statuses must be explicit and audited; M4 must decide handling an existing measurement when changing away from taken. Dismiss never changes an existing status.

## Errors and degradation

Error envelope: `{ schemaVersion, error: { code, message, fieldErrors, retryable }, requestId }`. Use 400 for invalid input, 401 unauthenticated, 404 for missing or unowned private objects, 409 for state/idempotency conflicts, 410 for expired analysis, 429 for quota and 503 for transient provider failure. Never leak another user's object existence through detailed error text.

Codes include `INVALID_INPUT`, `UNSUPPORTED_VEHICLE`, `ANALYSIS_EXPIRED`, `NO_ROUTES`, `PROVIDER_UNAVAILABLE`, `PRICE_UNAVAILABLE`, `PREDICTION_UNAVAILABLE`, `SAVE_FAILED`, `IDEMPOTENCY_CONFLICT`, `TRIP_SELECTION_CONFLICT`. Price/prediction unavailability can be per-route warnings in a successful partial analysis; complete routing failure returns a structured error. The UI must not hide partial-data warnings.

## Deterministic arithmetic example

All values below are synthetic test values and not vehicle evidence or Philippine price observations. Exact quote `78.00` PHP/L; route A fuel `2.5` L, range `2.3–2.7` → expected PHP `195.00`, range `179.40–210.60`. Route B `2.3` L, range `2.1–2.5` → PHP `179.40`, range `163.80–195.00`. If B takes seven minutes longer, its comparison is `+7 min, PHP 15.60 less` against A. At quote `80.00`, A becomes PHP `200.00`, with unchanged liters. Fixture recommendation may designate A with a clearly authored demo tradeoff explanation; this is not a chosen scoring algorithm.

## Persistence permission contract

Before a live provider is enabled, map every retained field to source, allowed use, retention/expiry, attribution and deletion behavior. Include derived fields, not just raw payloads. A missing policy mapping blocks live persistence. Fixture mode uses owned synthetic data and may retain complete snapshots. This contract specifies desired structure, not a grant of provider storage rights.
