# Google routing retention and ML feasibility

Reviewed 25 September 2026 against current official Google Maps Platform documentation. This is a technical feasibility review, not legal advice or acceptance of an account agreement. The matrix uses Google's published non-EEA terms; the future billing account, negotiated terms and applicable jurisdiction remain unknown. No account, key, billable request or Google route response was used.

## Sources and controlling uncertainty

- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms), especially §3.2.3 on scraping, caching, creating content and ML use.
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms), especially Routes API §19 for non-EEA customers.
- [Routes API policies and attribution](https://developers.google.com/maps/documentation/routes/policies).
- [Place ID storage and refresh guidance](https://developers.google.com/maps/documentation/places/web-service/place-id).
- [Maps URLs documentation](https://developers.google.com/maps/documentation/urls/get-started).

Google's general terms prohibit caching Google Maps Content unless the service-specific terms expressly allow it. They also prohibit creating content from Google Maps Content and explicitly list using it to train, test, validate or fine-tune ML/AI models. The non-EEA Routes terms expressly allow returned latitude/longitude caching for up to 30 consecutive days; the Routes policies expressly exempt place IDs from caching restrictions. No equally explicit durable-storage exception was located for route distance, duration, traffic values, labels, polylines or raw responses.

## Field-level matrix

| Field or record | Documented rule, or stated engineering classification | Conservative Intelligent Fuel treatment |
|---|---|---|
| User-entered origin/destination text | Engineering classification: independently supplied values must be distinguished from Google-resolved content | Retain with `source=user`; do not relabel a Google-resolved address as user-owned |
| App settings, selected vehicle/brand and app request ID | Engineering classification: app-authored/user-owned rather than Routes response content | Retain under project privacy rules |
| Place IDs | Routes policy explicitly permits indefinite storage; Google recommends refresh for old IDs | Durable storage allowed for the ID only; apply separate rules to associated place details |
| Independently obtained coordinates | Engineering classification: permission depends on their actual source | Retain only when source/privacy rules permit and provenance is explicit |
| Routes-returned latitude/longitude | Non-EEA service terms expressly permit temporary caching for 30 consecutive days | Add provider expiry and deletion; do not place in immutable history |
| Route distance and static duration | No field-specific caching exception located | Do not assume durable snapshot permission |
| Traffic-aware duration or traffic conditions | Google Maps Content; no field-specific caching exception located | No durable snapshot; never treat as owned training data |
| Provider route labels/description | No field-specific caching exception located | Use an app-authored transient route key; do not persist provider label as history by default |
| Encoded or decoded polyline, legs and steps | No encoded-polyline exception located; the coordinate exception does not expressly cover a reusable route shape | Keep out of durable storage unless future written terms explicitly permit it |
| Localized distance/duration strings | No separate exception located | Treat like the underlying provider metrics, not as harmless display text |
| Route token | No durable-storage exception located in the reviewed sources | Do not use as a durable route identity |
| Raw request/response payload | Mixes request data and restricted Google Maps Content | Do not retain wholesale; allow only redacted, approved operational metadata |
| Google/provider request ID and error detail | No specific retention permission located in reviewed pages | Review separately; do not retain payload fragments or locations by default |
| App latency, sanitized error class and request count | App-generated operational metadata; this is an engineering interpretation, not an express provider permission | Retain minimally without provider response content or raw locations |
| Fuel liters derived from Google route metrics | The creating-content restriction makes computation and retention terms-sensitive | Block Google-backed derivation until written terms/account review explicitly accepts the use |
| Peso cost derived from a Google-backed fuel estimate | Inherits the unresolved derivation chain even if the price source is independent | Block durable live cost snapshot with this provider path |
| Google content used as an ML feature or evaluation input | General terms explicitly prohibit using Google Maps Content to train, test, validate or fine-tune ML/AI | Exclude from all ML datasets and model evaluation; a thesis purpose is not a documented exception |

The absence of an exception is recorded as unresolved or blocked, not as proof that every possible use is prohibited. The project nevertheless needs a positive permission mapping before it can promise immutable history or ML reuse.

## Display and handoff requirements

Routes content may be shown without a map, but visible Google Maps attribution is required and provider content must be distinguishable from app-authored estimates. Results displayed on a map must use a Google Map and follow the supplied attribution rules. The production app would also need public terms and a privacy policy with Google's required notices.

Maps URLs remain a separate handoff mechanism. The official interface accepts origin, destination, mode and optional waypoints and requires no API key. It may open navigation or a route preview; it does not provide a documented arbitrary-polyline lock or trip-completion callback. Constructing a handoff URL from permitted input values grants no additional right to store Routes API content.

## Architecture decision resulting from this review

Do not enable a Google Routes adapter for the current immutable-history or ML design under the default published terms. Keep the owned synthetic fixture adapter and Google Maps URL handoff. Before live routing, choose one of these reviewable paths:

1. select a provider/license that expressly permits the required route metrics, derived fuel/cost results, immutable snapshots and research/ML use;
2. obtain applicable written Google terms that positively cover the planned fields and derivations, then revise this matrix; or
3. reduce live history and research scope through an explicit requirements/adviser decision rather than silently dropping or expiring required evidence.

For any provider candidate, repeat this matrix using the exact account terms and billing jurisdiction. Then run representative Cavite requests, record latency, route availability, attribution, failures and actual cost without placing provider content in Git.

## Decision status

D14 remains open. This review completes the field-matrix portion for one candidate and identifies a material mismatch; it does not select a replacement provider. D05 also remains open because no account, quota, budget or representative request was tested. The fixture application's saved snapshots remain independently authored synthetic data and are unaffected.
