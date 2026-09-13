import assert from "node:assert/strict";
import test from "node:test";
import { calculateCost } from "../src/domain/cost.js";
import { makeFixture } from "../src/fixtures/index.js";

test("AC05 fixture arithmetic uses unrounded exact decimal products", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const [a, b] = result.analysis.routes;
  assert.ok(a && b);
  assert.equal(a.costEstimate.expectedPhp, "195");
  assert.deepEqual(a.costEstimate.rangePhp, {
    lower: "179.4",
    upper: "210.6",
    kind: "cost_envelope",
  });
  assert.equal(b.costEstimate.expectedPhp, "179.4");
  assert.equal(b.route.durationSeconds - a.route.durationSeconds, 420);
});
test("AC06 changing quote leaves fuel unchanged", () => {
  const a = makeFixture("two-routes");
  const b = makeFixture("alternate-brand");
  assert.ok(a.ok && b.ok);
  assert.deepEqual(
    a.analysis.routes.map((r) => r.fuelEstimate),
    b.analysis.routes.map((r) => r.fuelEstimate),
  );
  assert.equal(b.analysis.routes[0]?.costEstimate.expectedPhp, "200");
  assert.equal(b.analysis.routes[0]?.costEstimate.rangePhp?.upper, "216");
});
test("missing price and unsupported prediction produce null cost, not zero", () => {
  for (const scenario of ["missing-price", "unsupported-prediction"] as const) {
    const result = makeFixture(scenario);
    assert.ok(result.ok);
    for (const r of result.analysis.routes) {
      assert.equal(r.costEstimate.status, "unavailable");
      assert.equal(r.costEstimate.expectedPhp, null);
      assert.equal(r.costEstimate.rangePhp, null);
    }
  }
});
test("source price range yields envelope without invented midpoint", () => {
  const result = makeFixture("ranged-price");
  assert.ok(result.ok);
  const cost = result.analysis.routes[0]?.costEstimate;
  assert.ok(cost);
  assert.equal(cost.expectedPhp, null);
  assert.deepEqual(cost.rangePhp, {
    lower: "174.8",
    upper: "216",
    kind: "cost_envelope",
  });
});
test("small decimal products retain precision before display rounding", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const fuel = result.analysis.routes[0]?.fuelEstimate;
  const quote = result.analysis.selectedPriceSnapshot;
  assert.ok(fuel && quote);
  const cost = calculateCost(
    { ...fuel, expectedLiters: "0.00000001", range: null },
    {
      ...quote,
      observation: { ...quote.observation, amountPhpPerLiter: "0.00000001" },
    },
  );
  assert.equal(cost.expectedPhp, "0.0000000000000001");
});
test("stale quote remains identified by its original observation date", () => {
  const result = makeFixture("stale-price");
  assert.ok(result.ok);
  assert.equal(result.analysis.selectedPriceSnapshot?.freshness, "stale");
  assert.equal(
    result.analysis.selectedPriceSnapshot?.observation.observedAt,
    "2026-08-01T00:00:00.000Z",
  );
});
