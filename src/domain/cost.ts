import { Decimal } from "decimal.js";
import {
  type CostEstimate,
  costEstimateSchema,
  type FuelEstimate,
  fuelEstimateSchema,
  type PriceSnapshot,
  priceSnapshotSchema,
} from "../contracts/index.js";

const Exact = Decimal.clone({ precision: 40 });
export function calculateCost(
  fuelInput: FuelEstimate,
  priceInput: PriceSnapshot | null,
): CostEstimate {
  const fuel = fuelEstimateSchema.parse(fuelInput);
  const snapshot =
    priceInput === null ? null : priceSnapshotSchema.parse(priceInput);
  const base = {
    currency: "PHP" as const,
    calculationVersion: "decimal-product-v1",
    priceObservationId: snapshot?.observation.id ?? null,
  };
  if (fuel.status === "unavailable" || snapshot === null)
    return costEstimateSchema.parse({
      ...base,
      status: "unavailable",
      expectedPhp: null,
      rangePhp: null,
      reason:
        fuel.status === "unavailable"
          ? "PREDICTION_UNAVAILABLE"
          : "PRICE_UNAVAILABLE",
    });
  const p = snapshot.observation;
  const multiply = (left: string, right: string) =>
    new Exact(left).mul(right).toFixed();
  const lowPrice = p.amountPhpPerLiter ?? p.lowerPhpPerLiter;
  const highPrice = p.amountPhpPerLiter ?? p.upperPhpPerLiter;
  if (!lowPrice || !highPrice)
    throw new Error("Validated price must have usable bounds.");
  const lowerFuel = fuel.range?.lowerLiters ?? fuel.expectedLiters;
  const upperFuel = fuel.range?.upperLiters ?? fuel.expectedLiters;
  const rangePhp =
    lowerFuel !== null &&
    upperFuel !== null &&
    (fuel.range !== null || p.amountPhpPerLiter === null)
      ? {
          lower: multiply(lowerFuel, lowPrice),
          upper: multiply(upperFuel, highPrice),
          kind: "cost_envelope" as const,
        }
      : null;
  return costEstimateSchema.parse({
    ...base,
    status: "available",
    expectedPhp:
      p.amountPhpPerLiter !== null && fuel.expectedLiters !== null
        ? multiply(fuel.expectedLiters, p.amountPhpPerLiter)
        : null,
    rangePhp,
    reason:
      p.amountPhpPerLiter === null
        ? "Source range only; no official point quote."
        : null,
  });
}
