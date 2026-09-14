# VED label and vehicle feasibility follow-up

14 September 2026. M1.3 research follow-up, independently reviewed by the data specialist and integrated by the lead. Candidate evidence only: D08–D11 remain unresolved and no model is trained.

## Measurement meaning

The [authors' paper, section II-C](https://arxiv.org/html/1905.02081#S2.SS3) prioritizes OEM fuel-rate estimates, then MAF with fuel-trim/air–fuel-ratio correction, then load/RPM/displacement-derived MAF, otherwise unavailable. These are estimates, not certified direct fuel measurements. Dimensional review of the printed MAF branch indicates a mass/time output; explicit density and time conversion must be resolved before calling it liters/hour. Do not copy the pseudocode into a liters target without that specification.

[Section III](https://arxiv.org/html/1905.02081#S3) removes trip-end portions and generalizes vehicle attributes. Therefore, consumption integrated over retained observations cannot automatically be labeled whole-journey consumption. This is a material mismatch with a pre-trip Cavite planner.

## Actual static join

Read the authors' [ICE/HEV workbook](https://github.com/gsoh/VED/blob/master/Data/VED_Static_Data_ICE%26HEV.xlsx) and [PHEV/EV workbook](https://github.com/gsoh/VED/blob/master/Data/VED_Static_Data_PHEV%26EV.xlsx), joining exact numeric vehicle identifiers to the same week inspected in [the first audit](ml-data-audit.md). No raw records are committed.

| Source | Records | SHA-256 |
|---|---:|---|
| ICE/HEV static | 357 | `addb23d937ef7d943620755f478cc5a24316a7d61dee232ffbfd9b6e50986dae` |
| PHEV/EV static | 27 | `e0f2b4d7a360074c17fd00068d8d8bf898f0e650f0cdda43c7e10883f6bf9340` |

The files contain 384 unique IDs: 264 ICE, 93 HEV, 24 PHEV, 3 EV. This differs from the paper's 383 vehicles / 92 HEVs. The cause is unresolved; no record was dropped to force agreement. All 258 dynamic vehicles matched, with no duplicate static keys.

| Powertrain | Vehicles in week | Rows | Vehicle/trip groups | Complete raw rate groups | Complete MAF groups | Complete MAF + both bank-1 trims groups |
|---|---:|---:|---:|---:|---:|---:|
| ICE | 171 | 323,615 | 551 | 0 | 430 | 55 |
| HEV | 67 | 110,630 | 226 | 0 | 220 | 45 |
| PHEV | 18 | 51,536 | 66 | 22 | 44 | 0 |
| EV | 2 | 3,633 | 11 | 0 | 0 | 0 |

All 16,073 nonnegative raw fuel-rate rows are PHEV, including 13,958 zeros. No ICE or HEV raw fuel rate is populated in this week. There are zero rows with simultaneous nonnegative raw rate, MAF, and both bank-1 trims. This sample cannot support direct overlap validation of that fully populated correction path.

"Complete" here means channel availability across the recorded group, not valid cadence, plausible values, accepted fuel labels, or a complete journey. Missing values are never replaced with zero. Across the static files, missing-cell counts are 289 transmission, 357 drive wheels, 352 vehicle class, and 16 generalized weight; these counts cover existing columns only. Engine configuration/displacement is a combined text field and needs explicit parsing and validation. These generalized records cannot populate named Philippine catalog variants.

## Proposed next experiment and gates

1. Define a retained-window target and its limitation separately from the application's full-trip estimate. Confirm the research claim with the adviser.
2. Write a versioned unit-checked derivation with explicit fuel density/composition, AFR, trim-bank and missing-channel rules. Preserve OEM, MAF-derived and load-derived provenance separately. Do not silently assume neutral missing trims.
3. Audit continuous windows, timestamp duplicates/gaps, zero interpretation and plausible bounds. Count independent eligible vehicles/windows after all exclusions. Add comparison evidence where usable channels overlap, potentially in another week.
4. Specify the prediction-time feature boundary: actual speed, RPM, MAF, load and realized duration are label/quality evidence, not pre-trip inputs. Quantify planned distance/ETA versus recorded-window mismatch.
5. Propose vehicle/time separation and a simple baseline before fitting anything. Training-only preprocessing and a locked held-out evaluation must precede reported model performance. External derived-label accuracy is not Cavite validation.

The next bounded task is the derivation specification and continuous-window audit, not application ML integration. No final dataset, model, split, scoring method or interval method is selected by this follow-up.

## Reproduction and checks

Optional research environment: Python 3.11+ with `openpyxl==3.1.5` in a separate virtual environment. The web app does not require Python. Download the linked source workbooks and preserve their hashes; local filenames below replace `&` with `_`.

```sh
python scripts/audit_ved_static.py /path/to/VED_171101_week.csv /path/to/VED_Static_Data_ICE_HEV.xlsx /path/to/VED_Static_Data_PHEV_EV.xlsx
python -m unittest discover -s scripts -p "test_audit_ved_static.py"
```

The audit emits aggregate counts and hashes only. Synthetic tests cover missing versus zero, incomplete channels, unmatched vehicles, duplicate static keys and blank trip identifiers. Raw GPS and vehicle/trip IDs are never printed. The specialist reviewed counting and privacy; the lead incorporated the blank-trip validation finding.
