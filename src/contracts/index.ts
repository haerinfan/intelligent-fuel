import { Decimal } from "decimal.js";
import { z } from "zod";

export const CONTRACT_VERSION = "0.1.0" as const;
const id = z.string().min(1).max(160);
const timestamp = z.iso.datetime();
export const decimal = z
  .string()
  .max(32)
  .regex(/^(0|[1-9]\d{0,11})(\.\d{1,8})?$/);
const positiveDecimal = decimal.refine((v) => new Decimal(v).gt(0));
const costDecimal = z
  .string()
  .max(48)
  .regex(/^(0|[1-9]\d{0,23})(\.\d{1,16})?$/);
const fuelType = z.enum(["gasoline", "diesel"]);
export const provenanceSchema = z.strictObject({
  mode: z.enum(["fixture", "observed", "user_reported", "derived"]),
  sourceName: z.string().min(1),
  sourceUrl: z.url().nullable(),
  observedAt: timestamp.nullable(),
  retrievedAt: timestamp,
  sourceVersion: id,
  retentionPolicyId: id,
});
export const locationSchema = z.strictObject({
  label: z.string().min(1).max(200),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  resolutionSource: z.enum(["fixture", "provider", "user_coordinates"]),
  providerPlaceId: id.nullable(),
});
export const vehicleSchema = z.strictObject({
  id,
  market: z.string(),
  brand: z.string(),
  model: z.string(),
  modelYear: z.number().int().min(1900).max(2100),
  variant: z.string(),
  vehicleClass: z.string(),
  provenance: provenanceSchema,
  displacementCc: z.number().int().positive().nullable(),
  transmission: z.string().nullable(),
  fuelType: fuelType.nullable(),
  compatibleGrades: z.array(id).nullable(),
  ratedKmPerLiter: positiveDecimal.nullable(),
});
export const fuelSelectionSchema = z.strictObject({
  brandId: id,
  fuelType,
  gradeId: id.nullable(),
});
export const analysisRequestSchema = z.strictObject({
  origin: locationSchema,
  destination: locationSchema,
  savedVehicleId: id,
  fuelSelection: fuelSelectionSchema,
  priceLocation: locationSchema,
});
export const inputSnapshotSchema = analysisRequestSchema.extend({
  vehicleSnapshot: vehicleSchema,
});
export const priceObservationSchema = z
  .strictObject({
    id,
    fuelType,
    gradeId: id.nullable(),
    brandId: id.nullable(),
    stationId: id.nullable(),
    currency: z.literal("PHP"),
    unit: z.literal("PHP_PER_LITER"),
    geographicBasis: z.enum(["station", "city", "regional", "general"]),
    geographyLabel: z.string().min(1),
    observedAt: timestamp,
    retrievedAt: timestamp,
    provenance: provenanceSchema,
    amountPhpPerLiter: positiveDecimal.nullable(),
    lowerPhpPerLiter: positiveDecimal.nullable(),
    upperPhpPerLiter: positiveDecimal.nullable(),
  })
  .superRefine((p, ctx) => {
    const exact =
      p.amountPhpPerLiter !== null &&
      p.lowerPhpPerLiter === null &&
      p.upperPhpPerLiter === null;
    const range =
      p.amountPhpPerLiter === null &&
      p.lowerPhpPerLiter !== null &&
      p.upperPhpPerLiter !== null;
    if (!exact && !range)
      ctx.addIssue({
        code: "custom",
        message: "Provide exactly one exact quote or a complete source range.",
      });
    if (
      p.lowerPhpPerLiter &&
      p.upperPhpPerLiter &&
      new Decimal(p.lowerPhpPerLiter).gt(p.upperPhpPerLiter)
    )
      ctx.addIssue({ code: "custom", message: "Price bounds are reversed." });
    if (p.brandId === null && p.geographicBasis !== "general")
      ctx.addIssue({
        code: "custom",
        message: "Brandless quotes must be labeled general fallback.",
      });
  });
export const priceSnapshotSchema = z.strictObject({
  observation: priceObservationSchema,
  freshness: z.enum(["fresh", "stale", "unknown"]),
  freshnessPolicyVersion: id,
  selectionPolicyVersion: id,
  matchedAt: timestamp,
});
const fuelRangeSchema = z
  .strictObject({
    lowerLiters: decimal,
    upperLiters: decimal,
    kind: z.enum(["demo", "heuristic", "calibrated"]),
    nominalCoverage: z.number().gt(0).lt(1).nullable(),
  })
  .superRefine((r, ctx) => {
    if (new Decimal(r.lowerLiters).gt(r.upperLiters))
      ctx.addIssue({ code: "custom", message: "Fuel bounds are reversed." });
    if (r.kind !== "calibrated" && r.nominalCoverage !== null)
      ctx.addIssue({
        code: "custom",
        message: "Demo/heuristic ranges cannot claim nominal coverage.",
      });
  });
export const fuelEstimateSchema = z
  .strictObject({
    status: z.enum(["available", "unavailable"]),
    methodId: id,
    methodVersion: id,
    validationStatus: z.enum(["fixture", "unvalidated", "validated"]),
    validationEvidenceRef: z.string().min(1).nullable(),
    expectedLiters: decimal.nullable(),
    range: fuelRangeSchema.nullable(),
    reason: z.string().nullable(),
  })
  .superRefine((f, ctx) => {
    const hasNumbers = f.expectedLiters !== null || f.range !== null;
    if ((f.status === "available") !== hasNumbers)
      ctx.addIssue({
        code: "custom",
        message: "Estimate availability must match numeric content.",
      });
    if (f.status === "unavailable" && !f.reason)
      ctx.addIssue({
        code: "custom",
        message: "Unavailable fuel needs a reason.",
      });
    if (
      f.expectedLiters &&
      f.range &&
      (new Decimal(f.expectedLiters).lt(f.range.lowerLiters) ||
        new Decimal(f.expectedLiters).gt(f.range.upperLiters))
    )
      ctx.addIssue({
        code: "custom",
        message: "Expected fuel is outside the range.",
      });
    if (
      (f.validationStatus === "validated" || f.range?.kind === "calibrated") &&
      !f.validationEvidenceRef
    )
      ctx.addIssue({
        code: "custom",
        message: "Validation claims require evidence.",
      });
    if (f.validationStatus === "fixture" && f.range && f.range.kind !== "demo")
      ctx.addIssue({
        code: "custom",
        message: "Fixture ranges must be demo ranges.",
      });
  });
export const costEstimateSchema = z
  .strictObject({
    status: z.enum(["available", "unavailable"]),
    currency: z.literal("PHP"),
    calculationVersion: id,
    priceObservationId: id.nullable(),
    expectedPhp: costDecimal.nullable(),
    rangePhp: z
      .strictObject({
        lower: costDecimal,
        upper: costDecimal,
        kind: z.literal("cost_envelope"),
      })
      .nullable(),
    reason: z.string().nullable(),
  })
  .superRefine((c, ctx) => {
    const hasNumbers = c.expectedPhp !== null || c.rangePhp !== null;
    if ((c.status === "available") !== hasNumbers)
      ctx.addIssue({
        code: "custom",
        message: "Cost availability must match numeric content.",
      });
    if (c.status === "available" && !c.priceObservationId)
      ctx.addIssue({
        code: "custom",
        message: "Available cost requires a quote.",
      });
    if (c.status === "unavailable" && !c.reason)
      ctx.addIssue({
        code: "custom",
        message: "Unavailable cost needs a reason.",
      });
    if (c.rangePhp && new Decimal(c.rangePhp.lower).gt(c.rangePhp.upper))
      ctx.addIssue({ code: "custom", message: "Cost bounds are reversed." });
  });
export const routeSchema = z.strictObject({
  id,
  label: z.string().min(1),
  distanceMeters: z.number().int().positive(),
  durationSeconds: z.number().int().positive(),
  trafficStatus: z.enum(["aware", "unaware", "unknown"]),
  calculatedAt: timestamp,
  provenance: provenanceSchema,
});
export const routeResultSchema = z.strictObject({
  route: routeSchema,
  fuelEstimate: fuelEstimateSchema,
  costEstimate: costEstimateSchema,
});
export const analysisSchema = z
  .strictObject({
    id,
    schemaVersion: z.literal(CONTRACT_VERSION),
    ownerId: id,
    createdAt: timestamp,
    expiresAt: timestamp,
    inputSnapshot: inputSnapshotSchema,
    routes: z.array(routeResultSchema).min(1),
    selectedPriceSnapshot: priceSnapshotSchema.nullable(),
    warnings: z.array(z.string().min(1)),
    recommendation: z.strictObject({
      status: z.enum(["available", "unavailable"]),
      routeId: id.nullable(),
      methodId: id,
      methodVersion: id,
      reasonCode: id,
      explanation: z.string().min(1),
    }),
  })
  .superRefine((a, ctx) => {
    if (Date.parse(a.expiresAt) <= Date.parse(a.createdAt))
      ctx.addIssue({
        code: "custom",
        message: "Analysis expiry must be after creation.",
      });
    const routeIds = a.routes.map((r) => r.route.id);
    if (new Set(routeIds).size !== routeIds.length)
      ctx.addIssue({ code: "custom", message: "Duplicate route IDs." });
    if (
      a.recommendation.status === "available" &&
      (!a.recommendation.routeId ||
        !routeIds.includes(a.recommendation.routeId))
    )
      ctx.addIssue({
        code: "custom",
        message: "Recommendation must refer to a returned route.",
      });
    if (
      a.recommendation.status === "unavailable" &&
      a.recommendation.routeId !== null
    )
      ctx.addIssue({
        code: "custom",
        message: "Unavailable recommendation must have no route.",
      });
    for (const r of a.routes) {
      if (
        r.costEstimate.status === "available" &&
        r.costEstimate.priceObservationId !==
          a.selectedPriceSnapshot?.observation.id
      )
        ctx.addIssue({
          code: "custom",
          message: "Cost must refer to the embedded quote snapshot.",
        });
      if (
        r.costEstimate.status === "available" &&
        r.fuelEstimate.status !== "available"
      )
        ctx.addIssue({
          code: "custom",
          message: "Available cost requires a fuel estimate.",
        });
    }
  });
export const tripSchema = z
  .strictObject({
    id,
    ownerId: id,
    analysisId: id,
    schemaVersion: z.literal(CONTRACT_VERSION),
    createdAt: timestamp,
    inputSnapshot: inputSnapshotSchema,
    recommendedRouteId: id.nullable(),
    selectedRouteId: id,
    routeSnapshots: z.array(routeResultSchema).min(1),
    selectedPriceSnapshot: priceSnapshotSchema.nullable(),
    status: z.enum(["planned", "taken", "not_taken"]),
    promptDismissedAt: timestamp.nullable(),
    handoffRequestedAt: timestamp.nullable(),
  })
  .superRefine((t, ctx) => {
    if (!t.routeSnapshots.some((r) => r.route.id === t.selectedRouteId))
      ctx.addIssue({
        code: "custom",
        message: "Selected route is not in snapshots.",
      });
  });
export type FuelEstimate = z.infer<typeof fuelEstimateSchema>;
export type PriceSnapshot = z.infer<typeof priceSnapshotSchema>;
export type CostEstimate = z.infer<typeof costEstimateSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type PlannedTrip = z.infer<typeof tripSchema>;
