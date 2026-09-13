import {
  type Analysis,
  analysisSchema,
  CONTRACT_VERSION,
  type FuelEstimate,
  type PlannedTrip,
  type PriceSnapshot,
  tripSchema,
  vehicleSchema,
} from "../contracts/index.js";
import { calculateCost } from "../domain/cost.js";

export const FIXTURE_VERSION = "cavite-demo-v1";
export const FIXTURE_TIME = "2026-09-12T00:00:00.000Z";
export const DEMO_NOTICE =
  "Synthetic demo data — not observed Cavite routes, current prices, or validated fuel predictions.";
const provenance = {
  mode: "fixture" as const,
  sourceName: "Intelligent Fuel synthetic fixtures",
  sourceUrl: null,
  observedAt: FIXTURE_TIME,
  retrievedAt: FIXTURE_TIME,
  sourceVersion: FIXTURE_VERSION,
  retentionPolicyId: "owned-synthetic-v1",
};
export const fixtureUsers = [
  { key: "test-user-a", name: "Demo Driver A", email: "driver-a@example.test" },
  { key: "test-user-b", name: "Demo Driver B", email: "driver-b@example.test" },
] as const;
export const fixtureVehicles = [
  vehicleSchema.parse({
    id: "demo-sedan-2024",
    market: "PH — synthetic",
    brand: "Demo Motors",
    model: "Sample Sedan",
    modelYear: 2024,
    variant: "Fixture CVT",
    vehicleClass: "Sedan",
    provenance,
    displacementCc: 1500,
    transmission: "CVT",
    fuelType: "gasoline",
    compatibleGrades: ["demo-regular"],
    ratedKmPerLiter: null,
  }),
  vehicleSchema.parse({
    id: "demo-hatch-2023",
    market: "PH — synthetic",
    brand: "Demo Motors",
    model: "Sample Hatch",
    modelYear: 2023,
    variant: "Fixture Manual",
    vehicleClass: "Hatchback",
    provenance,
    displacementCc: 1300,
    transmission: "Manual",
    fuelType: "gasoline",
    compatibleGrades: ["demo-regular"],
    ratedKmPerLiter: null,
  }),
];
export const fixtureOrigin = {
  label: "Synthetic Cavite-area origin",
  latitude: 14.3,
  longitude: 120.9,
  resolutionSource: "fixture" as const,
  providerPlaceId: null,
};
export const fixtureDestination = {
  label: "Synthetic Cavite-area destination",
  latitude: 14.4,
  longitude: 120.95,
  resolutionSource: "fixture" as const,
  providerPlaceId: null,
};
export const SCENARIOS = [
  "two-routes",
  "alternate-brand",
  "one-route",
  "no-routes",
  "provider-timeout",
  "missing-price",
  "stale-price",
  "general-price",
  "ranged-price",
  "unsupported-prediction",
  "traffic-unavailable",
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export type FixtureResult =
  | { ok: true; analysis: Analysis }
  | {
      ok: false;
      error: {
        code: "NO_ROUTES" | "PROVIDER_UNAVAILABLE";
        message: string;
        retryable: boolean;
      };
    };

export function makeFixture(
  scenario: Scenario,
  options: { ownerId?: string; now?: Date; id?: string } = {},
): FixtureResult {
  if (scenario === "no-routes")
    return {
      ok: false,
      error: {
        code: "NO_ROUTES",
        message: "Synthetic scenario: no routes returned.",
        retryable: false,
      },
    };
  if (scenario === "provider-timeout")
    return {
      ok: false,
      error: {
        code: "PROVIDER_UNAVAILABLE",
        message: "Synthetic scenario: route provider timed out.",
        retryable: true,
      },
    };
  const now = options.now ?? new Date(FIXTURE_TIME);
  const timestamp = now.toISOString();
  const observedAt =
    scenario === "stale-price"
      ? new Date(now.getTime() - 42 * 86400000).toISOString()
      : timestamp;
  const currentProvenance = {
    ...provenance,
    observedAt: timestamp,
    retrievedAt: timestamp,
  };
  const brandId =
    scenario === "alternate-brand" ? "demo-fuel-b" : "demo-fuel-a";
  const price: PriceSnapshot | null =
    scenario === "missing-price"
      ? null
      : {
          observation: {
            id: `demo-quote-${scenario}`,
            brandId: scenario === "general-price" ? null : brandId,
            fuelType: "gasoline",
            gradeId: "demo-regular",
            stationId: null,
            currency: "PHP",
            unit: "PHP_PER_LITER",
            geographicBasis: scenario === "general-price" ? "general" : "city",
            geographyLabel:
              "Synthetic origin area — not a Cavite price observation",
            observedAt,
            retrievedAt: timestamp,
            provenance: {
              ...currentProvenance,
              observedAt,
            },
            amountPhpPerLiter:
              scenario === "ranged-price"
                ? null
                : scenario === "alternate-brand"
                  ? "80.00"
                  : "78.00",
            lowerPhpPerLiter: scenario === "ranged-price" ? "76.00" : null,
            upperPhpPerLiter: scenario === "ranged-price" ? "80.00" : null,
          },
          freshness: scenario === "stale-price" ? "stale" : "fresh",
          freshnessPolicyVersion: "fixture-authored-v1",
          selectionPolicyVersion: "origin-area-fixture-v1",
          matchedAt: now.toISOString(),
        };
  const fuels: FuelEstimate[] = [
    {
      status: "available",
      expectedLiters: "2.5",
      range: {
        lowerLiters: "2.3",
        upperLiters: "2.7",
        kind: "demo",
        nominalCoverage: null,
      },
      methodId: "fixture-authored",
      methodVersion: FIXTURE_VERSION,
      validationStatus: "fixture",
      validationEvidenceRef: null,
      reason: "Synthetic values; no trained model.",
    },
    {
      status: "available",
      expectedLiters: "2.3",
      range: {
        lowerLiters: "2.1",
        upperLiters: "2.5",
        kind: "demo",
        nominalCoverage: null,
      },
      methodId: "fixture-authored",
      methodVersion: FIXTURE_VERSION,
      validationStatus: "fixture",
      validationEvidenceRef: null,
      reason: "Synthetic values; no trained model.",
    },
  ];
  const routes = fuels
    .slice(0, scenario === "one-route" ? 1 : 2)
    .map((f, index) => {
      const fuel: FuelEstimate =
        scenario === "unsupported-prediction"
          ? {
              ...f,
              status: "unavailable",
              expectedLiters: null,
              range: null,
              reason: "UNSUPPORTED_VEHICLE",
            }
          : f;
      return {
        route: {
          id: index === 0 ? "route-a" : "route-b",
          label: index === 0 ? "Demo direct route" : "Demo alternative route",
          distanceMeters: index === 0 ? 25000 : 27000,
          durationSeconds: index === 0 ? 2400 : 2820,
          trafficStatus:
            scenario === "traffic-unavailable" ? "unknown" : "aware",
          calculatedAt: now.toISOString(),
          provenance: currentProvenance,
        },
        fuelEstimate: fuel,
        costEstimate: calculateCost(fuel, price),
      };
    });
  const unsupported = scenario === "unsupported-prediction";
  const analysis = analysisSchema.parse({
    id: options.id ?? `analysis-${scenario}`,
    schemaVersion: CONTRACT_VERSION,
    ownerId: options.ownerId ?? "test-user-a",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
    inputSnapshot: {
      origin: fixtureOrigin,
      destination: fixtureDestination,
      priceLocation: fixtureOrigin,
      savedVehicleId: "saved-demo-sedan",
      fuelSelection: { brandId, fuelType: "gasoline", gradeId: "demo-regular" },
      vehicleSnapshot: fixtureVehicles[0],
    },
    selectedPriceSnapshot: price,
    routes,
    warnings: [
      DEMO_NOTICE,
      ...(scenario === "two-routes" ? [] : [`Synthetic scenario: ${scenario}`]),
    ],
    recommendation: {
      status: unsupported ? "unavailable" : "available",
      routeId: unsupported ? null : "route-a",
      methodId: "fixture-designated",
      methodVersion: FIXTURE_VERSION,
      reasonCode: unsupported ? "PREDICTION_UNAVAILABLE" : "DEMO_CHOICE",
      explanation: unsupported
        ? "A fuel-based recommendation is unavailable for this synthetic vehicle case."
        : scenario === "one-route"
          ? "Only one synthetic route was returned. No alternative comparison is available."
          : "Demo choice: the direct route takes seven fewer minutes. This explanation is authored for testing, not generated by a scoring model.",
    },
  });
  return { ok: true, analysis };
}

export function makeHistory(ownerId = "test-user-a"): PlannedTrip[] {
  return Array.from({ length: 7 }, (_, index) => {
    const result = makeFixture("two-routes", {
      ownerId,
      id: `history-analysis-${index}`,
      now: new Date(Date.parse(FIXTURE_TIME) - index * 86400000),
    });
    if (!result.ok) throw new Error("History requires successful fixture.");
    const a = result.analysis;
    return tripSchema.parse({
      id: `history-trip-${index}`,
      ownerId,
      analysisId: a.id,
      schemaVersion: CONTRACT_VERSION,
      createdAt: a.createdAt,
      inputSnapshot: a.inputSnapshot,
      recommendedRouteId: a.recommendation.routeId,
      selectedRouteId: "route-b",
      routeSnapshots: a.routes,
      selectedPriceSnapshot: a.selectedPriceSnapshot,
      status: "planned",
      promptDismissedAt: null,
      handoffRequestedAt: null,
      analysisCreatedAt: a.createdAt,
      recommendationSnapshot: a.recommendation,
      warnings: a.warnings,
    });
  });
}
