# First VED sample audit

13 September 2026. **Candidate only; not selected for training.** The data spike now includes an actual inspected file. A final label protocol, model and held-out split remain unresolved.

## Source and reproduction

The authors publish [VED](https://github.com/gsoh/VED) and an [Apache-2.0 license](https://github.com/gsoh/VED/blob/master/LICENSE). Their collection describes Ann Arbor vehicles, not Philippine driving. Keep source attribution and review redistribution obligations before packaging any dataset or derivative. No raw telemetry is included in this repository.

Downloaded [dynamic part 1](https://raw.githubusercontent.com/gsoh/VED/master/Data/VED_DynamicData_Part1.7z), 82,723,769 bytes. SHA-256: `44d53754fd39e196171ec09f123604375d0248d5c06a97d6695ef0e22a948c61`. Extracted only `VED_171101_week.csv`, 67,308,873 bytes, SHA-256 `5846f9ffa1d66bfffae4b16f0983bd88139e630017b98f219650923fd2101aa8`. Archive and extraction are outside Git in the local work folder. The archive has 22 weekly CSV entries; only this first week was audited.

Run the aggregate-only standard-library audit with Python 3.11 or newer:

```sh
python scripts/audit_ved.py /path/to/VED_171101_week.csv
```

It inspects finite fuel-rate values and timestamp gaps by vehicle/trip and emits aggregate counts and a hash. It never emits GPS coordinates or per-vehicle identifiers. Python is optional for the web app.

## Findings in this file

| Check | Result |
|---|---:|
| Telemetry rows | 489,414 |
| Distinct vehicles | 258 |
| Distinct vehicle/trip groups | 854 |
| Missing/nonfinite fuel-rate rows | 473,341 |
| Nonnegative fuel-rate rows | 16,073 |
| Zero fuel-rate rows | 13,958 |
| Vehicles with any nonnegative fuel rate | 6 |
| Vehicles with any positive fuel rate | 3 |
| Groups with complete nonnegative rate and finite time | 22 |
| Complete groups with duplicate timestamps | 0 |
| Complete groups with a gap over 30 seconds | 1 |
| Groups passing exploratory cadence screen | 21 |

The exploratory screen requires two or more samples, complete nonnegative rates and strictly positive sorted gaps no greater than 30 seconds. This is a diagnostic, not an approved measurement protocol. Trapezoidal integration on these groups spans 0–0.568835484 L. These are **not accepted training labels**: zero readings, powertrains, sensor-channel meanings and trip completeness need investigation. Telemetry-row count is not independent labeled-trip count.

## Prediction-time mapping

| Candidate | Application input | Decision |
|---|---|---|
| Fuel rate with timestamps | Target liters after the trip | Validate channel semantics and integration before accepting labels |
| Actual speed and engine/load signals | No pre-trip equivalent | Exclude from pre-trip prediction; quality/measurement use only |
| Actual distance from telemetry | Planned route distance | Different measurement; quantify mapping and mismatch |
| Actual duration | Planned ETA | Not interchangeable without evidence |
| Vehicle identity/static attributes | Catalog snapshot | Static-file join and common features not audited |
| Fuel brand and price | Cost calculation only | Exclude from liters prediction |

## Decision from the spike

Do not select raw VED fuel rate as a ready-to-train label source. The inspected channel is sparse and heavily zero-valued. Next inspect the paper's measurement/derivation details and join static powertrain records; determine whether a justified derived label is possible. Then freeze trip quality and group-aware evaluation policies before fitting a baseline. This is a research follow-up, not permission to fill missing rates with zero or use future driving signals as planned inputs.

The September 15 gate remains open: sample inspection is complete; label acceptance, feature mapping and research claim agreement are not. No model was trained. External performance cannot establish Cavite accuracy. Preserve D08–D11 and escalate any adviser/deadline conflict rather than relabeling fixtures as ML.
