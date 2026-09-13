import assert from "node:assert/strict";
import test from "node:test";
import {
  analysisRequestSchema,
  analysisSchema,
  costEstimateSchema,
  decimal,
  fuelEstimateSchema,
  priceObservationSchema,
} from "../src/contracts/index.js";
import { makeFixture, makeHistory, SCENARIOS } from "../src/fixtures/index.js";

test("all bounded fixture scenarios validate, including explicit errors", () => {
  for (const scenario of SCENARIOS) {
    const result = makeFixture(scenario);
    if (result.ok) assert.ok(analysisSchema.safeParse(result.analysis).success);
    else
      assert.ok(
        ["NO_ROUTES", "PROVIDER_UNAVAILABLE"].includes(result.error.code),
      );
  }
});
test("request rejects client ownership and invalid coordinates", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const { vehicleSnapshot: _vehicle, ...request } =
    result.analysis.inputSnapshot;
  assert.ok(analysisRequestSchema.safeParse(request).success);
  assert.equal(
    analysisRequestSchema.safeParse({ ...request, ownerId: "victim" }).success,
    false,
  );
  assert.equal(
    analysisRequestSchema.safeParse({
      ...request,
      origin: { ...request.origin, latitude: 91 },
    }).success,
    false,
  );
});
test("quantity boundary rejects fake zero alternatives and malformed numbers", () => {
  for (const invalid of ["-1", "NaN", "Infinity", "1e3", "", " 2", "01.2"])
    assert.equal(decimal.safeParse(invalid).success, false);
  assert.ok(decimal.safeParse("0").success);
  assert.equal(
    costEstimateSchema.safeParse({
      status: "unavailable",
      currency: "PHP",
      calculationVersion: "v1",
      priceObservationId: null,
      expectedPhp: "0",
      rangePhp: null,
      reason: "missing price",
    }).success,
    false,
  );
});
test("fabricated statistical confidence and reversed fuel ranges are rejected", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const fuel = result.analysis.routes[0]?.fuelEstimate;
  assert.ok(fuel?.range);
  assert.equal(
    fuelEstimateSchema.safeParse({
      ...fuel,
      range: { ...fuel.range, nominalCoverage: 0.95 },
    }).success,
    false,
  );
  assert.equal(
    fuelEstimateSchema.safeParse({
      ...fuel,
      range: { ...fuel.range, lowerLiters: "3.0" },
    }).success,
    false,
  );
  assert.equal(
    fuelEstimateSchema.safeParse({ ...fuel, validationStatus: "validated" })
      .success,
    false,
  );
});
test("quote cannot mix exact and ranged price or hide general fallback", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const price = result.analysis.selectedPriceSnapshot?.observation;
  assert.ok(price);
  assert.equal(
    priceObservationSchema.safeParse({
      ...price,
      lowerPhpPerLiter: "76",
      upperPhpPerLiter: "80",
    }).success,
    false,
  );
  assert.equal(
    priceObservationSchema.safeParse({ ...price, brandId: null }).success,
    false,
  );
});
test("dangling recommendation, duplicate routes and broken quote references fail", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const a = result.analysis;
  assert.equal(
    analysisSchema.safeParse({
      ...a,
      recommendation: { ...a.recommendation, routeId: "not-returned" },
    }).success,
    false,
  );
  assert.equal(
    analysisSchema.safeParse({ ...a, routes: [a.routes[0], a.routes[0]] })
      .success,
    false,
  );
  assert.equal(
    analysisSchema.safeParse({ ...a, selectedPriceSnapshot: null }).success,
    false,
  );
});
test("seven history records carry independent embedded snapshots", () => {
  const history = makeHistory();
  assert.equal(history.length, 7);
  const first = history[0];
  const second = history[1];
  assert.ok(first?.selectedPriceSnapshot && second?.selectedPriceSnapshot);
  first.selectedPriceSnapshot.observation.amountPhpPerLiter = "999";
  assert.equal(
    second.selectedPriceSnapshot.observation.amountPhpPerLiter,
    "78.00",
  );
  assert.equal(
    makeHistory()[0]?.selectedPriceSnapshot?.observation.amountPhpPerLiter,
    "78.00",
  );
  assert.ok(
    history.every(
      (t) =>
        t.selectedRouteId === "route-b" &&
        t.recommendedRouteId === "route-a" &&
        t.status === "planned",
    ),
  );
});

test("history quote times do not come from a future analysis", () => {
  for (const trip of makeHistory()) {
    assert.ok(trip.selectedPriceSnapshot);
    assert.ok(
      Date.parse(trip.selectedPriceSnapshot.observation.observedAt) <=
        Date.parse(trip.createdAt),
    );
  }
});
test("one-route explanation does not invent an alternative comparison", () => {
  const result = makeFixture("one-route");
  assert.ok(result.ok);
  assert.equal(result.analysis.routes.length, 1);
  assert.match(result.analysis.recommendation.explanation, /Only one/);
  assert.doesNotMatch(result.analysis.recommendation.explanation, /fewer/);
});
