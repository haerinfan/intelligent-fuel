# Product requirements

Version 0.1, foundation. Audience: thesis team, adviser and implementation agents. G means the requirement comes from the guide; P means a proposed engineering addition. The guide does not define the thesis research question or establish predictive validity.

## Scope

Confirmed by the user: school thesis prototype. Build a responsive web app that helps a driver compare estimated fuel use and cost across available routes, then hands navigation to Google Maps. Start with a bounded demonstration dataset and location selected in D02 and D03. A small initial catalogue must not impose a structural limit of five trips or a few vehicle variants.

Two delivery gates are distinct: M2 proves the workflow using visible demo data; M5 concerns research evaluation. Live-data integration in M3 does not by itself make predictions validated.

## Functional requirements

| ID | Requirement | Source | Delivery |
|---|---|---|---|
| FR01 | Sign up/login, remember vehicles and preferred brand; no unnecessary profile onboarding | G §§1–2 | M2 |
| FR02 | Search vehicle by brand/model/year/variant with live suggestions; browse brand → optional type → model → year → variant | G §3 | M2 |
| FR03 | Load available specifications automatically; reliable rated economy is optional; offer minimum manual fallback for missing vehicles | G §3 | M2 |
| FR04 | Garage supports multiple vehicles and a default; schema accommodates 500+ variants without requiring 500 at launch | G §3 | M2/M3 |
| FR05 | Planner has From, Destination, Vehicle, Fuel Brand and Analyze; defaults remain editable in place | G §§4–5,12 | M2 |
| FR06 | Match price to fuel type and applicable grade; use station → city → regional brand → general fallback priority, when usable | G §4 | M2/M3 |
| FR07 | Brand affects cost only; show price basis and last update, especially fallbacks | G §§4,14 | M2 |
| FR08 | Retrieve available alternative routes and traffic-aware information; predict each supported route | G §6 | M2 fixtures, M3 provider |
| FR09 | Show one Smart Recommended Route plus available alternatives, map preview, distance, time, fuel range/expected fuel, cost range/expected cost and a brief explanation | G §7 | M2; research claim gate M5 |
| FR10 | Do not ask the user to choose Fastest/Balanced/Fuel Saver before analysis | G §§7,14 | M2 |
| FR11 | Allow selecting another route and opening it in Google Maps; navigation belongs to Maps | G §8 | M2/M3 |
| FR12 | Save planned analysis before/at handoff with origin/destination, vehicle, brand, price/time, recommended and selected route, prediction, cost, distance/time and analysis timestamp | G §9 | M2 |
| FR13 | Dashboard shows latest five trips; full history supports date, vehicle, destination, status and actual-data filters without a five-record storage cap | G §10 | M2 basic, M4 filters |
| FR14 | On return ask Yes/No/Dismiss; status derives from user response, not Maps events | G §11 | M4 |
| FR15 | Actual liters entry is optional; trip taken without reliable measured data is not a trusted training label | G §11 | M4 |
| FR16 | Returning users use default vehicle and preferred brand and can immediately plan again | G §12 | M2 |
| FR17 | Loading, unavailable data, provider failure and retry states must retain user inputs and avoid false success | P | M2 |
| FR18 | Historical results use immutable price, vehicle and prediction snapshots subject to provider storage rules | P, supports G §9 | M2/M3 |
| FR19 | Explicit demo labels distinguish fixture data and unvalidated intervals from live observations and validated predictions | P, supports G §14 | All stages |

## Quality and thesis requirements

| ID | Proposed requirement | Verification |
|---|---|---|
| NFR01 | Core journey works at 360px mobile and 1280px desktop widths without horizontal overflow; primary controls work by keyboard | Browser checks in AC14 |
| NFR02 | A user cannot read or mutate another user's garage, analyses or trips | Negative API checks in AC15 |
| NFR03 | Use meters, seconds, liters, PHP/liter and explicit timestamps internally; calculate cost before display rounding | Arithmetic cases AC05–06 |
| NFR04 | Analyze retries and repeated handoff clicks do not create duplicate planned trips | AC09–10 |
| NFR05 | Record provider latency, estimate method version, error class and request count without raw private locations in routine logs | M3 evidence |
| NFR06 | M2 fixture analysis target: p95 ≤2 seconds across 30 scripted runs on a recorded machine; excludes first app load. This is a proposed test target, not an observed result | M2 timing report |
| NFR07 | Define live latency, quota and budget targets after provider spike; use bounded timeouts and limited retries | D05 and D13 |
| NFR08 | Research metrics, sample design, holdout strategy and permitted claims must be agreed before reporting effectiveness | M5 protocol and results |
| NFR09 | Collect only needed account and trip data; agree consent, retention and deletion before recruiting real participants | D12 and M4 |

## Excluded from the initial build

Turn-by-turn navigation, background location tracking, automatic trip completion, nationwide price coverage, guaranteed exact Maps route reproduction, mandatory actual-fuel entry, production-scale operations and a runtime LLM agent system. Admin UI and model monitoring tools are later work; curated seed files suffice initially.

## Explicitly deferred research decisions

The exact recommendation score, ML model/training implementation, collection and validation methodology, prediction-range method, fuel-price API/scraping architecture and final vehicle ingestion/count remain open per guide §16. Temporary fixtures must carry a distinct method identifier and cannot resolve these choices implicitly.
