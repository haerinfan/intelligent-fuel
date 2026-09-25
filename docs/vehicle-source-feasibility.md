# Philippine vehicle source feasibility

Reviewed 24 September 2026. This bounded source spike tests whether two current Philippine-market variants can enter an evidence-backed prototype catalog. It does not select the final catalog, assert local prevalence, or provide inputs for a trained model.

## Candidate findings

| Field | Toyota Vios 1.3 XLE CVT | Mitsubishi Mirage GLX CVT |
|---|---|---|
| Market | Philippines | Philippines |
| Manufacturer wording for class | Sedan | Compact car; normalized class remains null pending an explicit hatchback source or catalog policy |
| Exact model year | null | null; the brochure filename says `25MY`, but explicit model-year applicability remains unverified |
| Exact variant | 1.3 XLE CVT | GLX CVT |
| Engine | Dual VVT-i, 4-cylinder in-line DOHC 16V EFI; 1NR-FE in brochure | 1.2-liter 3-cylinder in-line DOHC MIVEC gasoline (3A92), Euro 4 |
| Displacement | 1,329 cc | 1,193 cc |
| Transmission | CVT | INVECS-III CVT |
| Fuel type | null pending an explicit variant-linked value | gasoline |
| Compatible/minimum grade | null | null |
| Rated fuel economy | null | null |
| Cavite measured economy | null | null |

The candidates are useful for catalog-identity testing because the exact variant names, displacement and transmissions are supported. They are **not estimator-ready**: neither inspected evidence package provides a variant-specific, real-world Cavite fuel-consumption baseline, and exact model-year applicability is unverified.

## Primary evidence

### Toyota Vios 1.3 XLE CVT

- [Toyota Motor Philippines Vios page](https://www.toyota.com.ph/vios), accessed 24 September 2026, lists the current Philippine `1.3 XLE CVT` variant, CVT, engine description and sedan product class.
- [Toyota Motor Philippines Vios brochure](https://content.toyota.com.ph/uploads/vehicles/4/001_4_1713246001901_000.pdf) lists the 1.3 grades with 1NR-FE, 1,329 cc and CVT/5-speed M/T availability. Automated direct download returned access denied during this audit, so no local hash or independent visual copy is recorded.
- [Toyota Philippines price list](https://toyota.com.ph/index.php/price-list) still listed the `1.3 XLE CVT` on 24 September 2026 and displayed a price-list effective date of 25 August 2026. Price is inventory context only and is excluded from the vehicle contract.

The page and brochure do not state an exact model year in the inspected content. Do not convert the brochure upload timestamp or current listing date into a model year. Fuel type, grade compatibility and rated km/L remain null rather than inferred from the engine name or marketing language.

### Mitsubishi Mirage GLX CVT

- [Mitsubishi Motors Philippines Mirage page](https://www.mitsubishi-motors.com.ph/cars/mirage), accessed 24 September 2026, lists `Mirage GLX CVT`, `1.2L Gasoline`, CVT and the 3A92 engine family.
- [Official Mirage brochure](https://www.mitsubishi-motors.com.ph/content/dam/mitsubishi-motors-ph/images/brochures/26my-brochures/25MY%20MIRAGE%20Digital%20Brochure.pdf) visually confirms `GLX CVT`, 1,193 cc, gasoline, Euro 4 and INVECS-III CVT on its specification page. Audit SHA-256: `7006b1ea86ba720c20e5287fc38b4b2645e43f4ab12622ff440c37e2a22c6ad3`.

The filename labels the asset `25MY` while its enclosing directory says `26my-brochures`; the visible specification page does not print a model year or applicability rule. Preserve this only as a filename-derived source label and keep catalog `modelYear=null` until year-specific manufacturer/dealer evidence resolves the conflict. The brochure makes qualitative fuel-efficiency statements but provides no km/L value, test cycle or uncertainty, so `ratedKmPerLiter` remains null.

## Draft staging record

Current runtime `VehicleVariant` requires a model year. Source research needs a staging record that can preserve evidence without forcing a year or fuel-economy value.

```text
CatalogSourceRecord
  market: string
  brand: string
  model: string
  variant: string
  sourceName: string
  sourceUrl: string
  sourceVersion: string | null
  sourcePublishedAt: date | null
  retrievedAt: timestamp
  sourceFileSha256: string | null
  modelYear: integer | null
  vehicleClass: string | null
  displacementCc: positive integer | null
  transmission: string | null
  fuelType: gasoline | diesel | null
  compatibleGrades: string[] | null
  ratedKmPerLiter: positive decimal | null
  fuelEconomyTestMethod: string | null
  reviewStatus: pending | verified | rejected
  reviewedBy: string | null
  reviewedAt: timestamp | null
  notes: string[]
```

Normalization to `VehicleVariant` requires an exact model year and evidence supporting every populated field for that year/variant. A current sales page can establish market availability at retrieval time; it does not establish model-year applicability. A participant vehicle's identity is a later collection/protocol concern. Marketing fuel-efficiency wording is not a numeric baseline. A published laboratory figure, if later found, must retain its test method and must not be treated as a Cavite route label.

## Prototype acceptance checks

1. Exact market, brand, model and variant strings link to dated manufacturer evidence.
2. Model year is supported by a year-specific brochure, owner's manual applicability, registration evidence or another adviser-approved source; page timestamps are not substituted.
3. Displacement, transmission, fuel type and grade are populated independently only when explicit.
4. Missing values remain null and visibly prevent unsupported prediction.
5. Any rated km/L value includes its test cycle and source; marketing adjectives are not converted into numbers.
6. A second reviewer checks the evidence mapping before a record enters the user-facing catalog.
7. Real participant vehicle data and documents stay outside Git and follow the future consent/retention protocol.

## Decision boundary

This completes the two-candidate source inspection in M1.3. D03 remains open because exact model-year evidence, final count, Cavite participant fit and catalog permission/review ownership are unresolved. No real catalog entries replace the synthetic fixtures yet. D08-D11 remain deferred; these specifications are candidate metadata, not ML labels or a validated feature set.
