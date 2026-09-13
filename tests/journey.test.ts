import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createAuth, migrateAuth } from "../src/auth.js";
import { analysisSchema, tripSchema } from "../src/contracts/index.js";
import { openDatabase } from "../src/database.js";
import {
  fixtureDestination,
  fixtureOrigin,
  makeFixture,
  makeHistory,
} from "../src/fixtures/index.js";

const origin = "http://127.0.0.1:3000";
async function context() {
  const db = openDatabase(":memory:");
  const auth = createAuth(db, origin, randomBytes(48).toString("hex"));
  await migrateAuth(auth);
  let now = new Date("2026-09-13T02:00:00.000Z");
  const app = createApp(auth, origin, db, () => now);
  const cookies: string[] = [];
  for (const user of ["a", "b"]) {
    const signup = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { origin },
      payload: {
        name: `Test ${user}`,
        email: `${user}@example.test`,
        password: randomBytes(24).toString("hex"),
      },
    });
    assert.equal(signup.statusCode, 200, signup.body);
    cookies.push(signup.cookies.map((c) => `${c.name}=${c.value}`).join("; "));
  }
  const request = (
    url: string,
    payload?: object,
    user = 0,
    method?: "GET" | "POST" | "PATCH" | "DELETE",
  ) =>
    app.inject({
      method: method ?? (payload ? "POST" : "GET"),
      url: `/api/v1${url}`,
      headers: { origin, cookie: cookies[user] ?? "" },
      ...(payload ? { payload } : {}),
    });
  const create = await request("/garage", {
    catalogVehicleId: "demo-sedan-2024",
  });
  assert.equal(create.statusCode, 201, create.body);
  const vehicle = create.json().vehicle;
  const input = {
    origin: fixtureOrigin,
    destination: fixtureDestination,
    savedVehicleId: vehicle.id,
    fuelSelection: {
      brandId: "demo-fuel-a",
      fuelType: "gasoline",
      gradeId: "demo-regular",
    },
    priceLocation: fixtureOrigin,
    scenario: "two-routes",
  };
  return {
    app,
    auth,
    db,
    cookies,
    request,
    vehicle,
    input,
    advance: () => {
      now = new Date(now.getTime() + 16 * 60000);
    },
    close: async () => {
      await app.close();
      db.close();
    },
  };
}

test("AC01-12: authenticated journey preserves brand-independent liters, idempotency and historical snapshots", async (t) => {
  const c = await context();
  t.after(c.close);
  const first = await c.request("/analyses", c.input);
  assert.equal(first.statusCode, 201, first.body);
  const a = first.json().analysis;
  assert.equal(a.routes[0].costEstimate.expectedPhp, "195");
  assert.equal(a.routes[0].costEstimate.rangePhp.lower, "179.4");
  assert.equal(a.routes[0].costEstimate.rangePhp.upper, "210.6");
  const alternative = await c.request("/analyses", {
    ...c.input,
    fuelSelection: { ...c.input.fuelSelection, brandId: "demo-fuel-b" },
  });
  assert.equal(alternative.statusCode, 201, alternative.body);
  const b = alternative.json().analysis;
  assert.deepEqual(
    a.routes.map((r: { fuelEstimate: unknown }) => r.fuelEstimate),
    b.routes.map((r: { fuelEstimate: unknown }) => r.fuelEstimate),
  );
  assert.equal(b.routes[0].costEstimate.expectedPhp, "200");
  assert.equal(b.recommendation.routeId, a.recommendation.routeId);
  assert.equal(
    a.routes[1].route.durationSeconds - a.routes[0].route.durationSeconds,
    420,
  );
  assert.equal(a.routes[1].costEstimate.expectedPhp, "179.4");
  const body = { analysisId: a.id, selectedRouteId: "route-b" };
  const failed = await c.request("/trips", { ...body, simulateFailure: true });
  assert.equal(failed.statusCode, 503);
  assert.equal((await c.request("/trips")).json().trips.length, 0);
  const saved = await c.request("/trips", body);
  assert.equal(saved.statusCode, 201, saved.body);
  const trip = saved.json().trip;
  assert.equal(trip.status, "planned");
  assert.equal(trip.selectedRouteId, "route-b");
  assert.equal(trip.recommendedRouteId, "route-a");
  assert.equal(trip.analysisCreatedAt, a.createdAt);
  assert.deepEqual(trip.recommendationSnapshot, a.recommendation);
  const url = new URL(saved.json().mapsUrl);
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.searchParams.get("destination"), "14.4,120.95");
  assert.equal(url.searchParams.get("api"), "1");
  const retry = await c.request("/trips", body);
  assert.equal(retry.statusCode, 200);
  assert.deepEqual(retry.json(), saved.json());
  const simultaneous = await Promise.all([
    c.request("/trips", body),
    c.request("/trips", body),
  ]);
  assert.ok(
    simultaneous.every(
      (r) => r.statusCode === 200 && r.json().trip.id === trip.id,
    ),
  );
  const conflict = await c.request("/trips", {
    ...body,
    selectedRouteId: "route-a",
  });
  assert.equal(conflict.statusCode, 409);
  assert.equal(
    (await c.request("/preferences", { brandId: "demo-fuel-b" }, 0, "PATCH"))
      .statusCode,
    200,
  );
  assert.equal(
    (await c.request(`/garage/${c.vehicle.id}`, undefined, 0, "DELETE"))
      .statusCode,
    200,
  );
  assert.deepEqual((await c.request(`/trips/${trip.id}`)).json().trip, trip);
  const manual = await c.request("/garage", {
    manual: { label: "Unknown car", fuelType: null },
  });
  assert.equal(manual.statusCode, 201);
  const mv = manual.json().vehicle;
  assert.equal(mv.vehicleSnapshot.modelYear, null);
  assert.equal(mv.vehicleSnapshot.brand, null);
  const manualAnalysis = await c.request("/analyses", {
    ...c.input,
    savedVehicleId: mv.id,
    fuelSelection: { ...c.input.fuelSelection, gradeId: null },
  });
  assert.equal(manualAnalysis.statusCode, 201, manualAnalysis.body);
  assert.equal(
    manualAnalysis.json().analysis.routes[0].fuelEstimate.expectedLiters,
    null,
  );
  assert.equal(
    manualAnalysis.json().analysis.routes[0].costEstimate.expectedPhp,
    null,
  );
});

test("AC15: real sessions deny cross-owner reads and writes, with consistent missing-record responses", async (t) => {
  const c = await context();
  t.after(c.close);
  const a = (await c.request("/analyses", c.input)).json().analysis;
  const trip = (
    await c.request("/trips", { analysisId: a.id, selectedRouteId: "route-b" })
  ).json().trip;
  for (const path of [
    `/garage/${c.vehicle.id}`,
    `/analyses/${a.id}`,
    `/trips/${trip.id}`,
  ]) {
    const response = await c.request(path, undefined, 1);
    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, "NOT_FOUND");
    assert.equal(response.json().trip, undefined);
    const unknown = await c.request(
      `${path.split("/").slice(0, -1).join("/")}/unknown`,
      undefined,
      1,
    );
    assert.deepEqual(response.json().error, unknown.json().error);
  }
  assert.equal(
    (await c.request(`/garage/${c.vehicle.id}`, undefined, 1, "DELETE"))
      .statusCode,
    404,
  );
  assert.equal(
    (
      await c.request(
        "/preferences",
        { defaultVehicleId: c.vehicle.id },
        1,
        "PATCH",
      )
    ).statusCode,
    404,
  );
  assert.equal((await c.request("/analyses", c.input, 1)).statusCode, 404);
  assert.equal(
    (
      await c.request(
        "/trips",
        { analysisId: a.id, selectedRouteId: "route-b" },
        1,
      )
    ).statusCode,
    404,
  );
  assert.equal(
    (await c.request("/trips", undefined, 1)).json().trips.length,
    0,
  );
  const csrf = await c.app.inject({
    method: "POST",
    url: "/api/v1/garage",
    headers: { cookie: c.cookies[0], origin: "https://attacker.example" },
    payload: { catalogVehicleId: "demo-sedan-2024" },
  });
  assert.equal(csrf.statusCode, 403);
  assert.equal((await c.app.inject({ url: "/api/v1/trips" })).statusCode, 401);
  assert.equal((await c.request(`/trips/${trip.id}`)).statusCode, 200);
});

test("AC03,12,13,17: invalid inputs never persist; degraded cases stay explicit and expiry allows only saved retries", async (t) => {
  const c = await context();
  t.after(c.close);
  for (const input of [
    { ...c.input, ownerId: "victim" },
    { ...c.input, destination: { ...fixtureDestination, label: "unresolved" } },
    { ...c.input, destination: fixtureOrigin },
    {
      ...c.input,
      fuelSelection: { ...c.input.fuelSelection, fuelType: "diesel" },
    },
    {
      ...c.input,
      fuelSelection: { ...c.input.fuelSelection, gradeId: "wrong" },
    },
  ])
    assert.equal((await c.request("/analyses", input)).statusCode, 400);
  assert.equal(
    (c.db.prepare("SELECT count(*) AS n FROM analyses").get() as { n: number })
      .n,
    0,
  );
  for (const [scenario, status] of [
    ["no-routes", 422],
    ["provider-timeout", 503],
  ] as const) {
    const result = await c.request("/analyses", { ...c.input, scenario });
    assert.equal(result.statusCode, status);
    assert.equal(result.json().analysis, undefined);
  }
  for (const scenario of [
    "missing-price",
    "stale-price",
    "general-price",
    "ranged-price",
    "unsupported-prediction",
    "one-route",
    "traffic-unavailable",
  ]) {
    const result = await c.request("/analyses", { ...c.input, scenario });
    assert.equal(result.statusCode, 201, result.body);
    const a = analysisSchema.parse(result.json().analysis);
    if (scenario === "missing-price")
      assert.equal(a.routes[0]?.costEstimate.expectedPhp, null);
    if (scenario === "stale-price")
      assert.equal(a.selectedPriceSnapshot?.freshness, "stale");
    if (scenario === "general-price")
      assert.equal(a.selectedPriceSnapshot?.observation.brandId, null);
    if (scenario === "ranged-price") {
      assert.equal(a.routes[0]?.costEstimate.expectedPhp, null);
      assert.ok(a.routes[0]?.costEstimate.rangePhp);
    }
    if (scenario === "unsupported-prediction")
      assert.equal(a.routes[0]?.fuelEstimate.expectedLiters, null);
    if (scenario === "one-route") assert.equal(a.routes.length, 1);
    if (scenario === "traffic-unavailable")
      assert.equal(a.routes[0]?.route.trafficStatus, "unknown");
  }
  const a = (await c.request("/analyses", c.input)).json().analysis;
  const b = (await c.request("/analyses", c.input)).json().analysis;
  const body = { analysisId: a.id, selectedRouteId: "route-b" };
  const saved = await c.request("/trips", body);
  c.advance();
  assert.equal(
    (
      await c.request("/trips", {
        analysisId: b.id,
        selectedRouteId: "route-b",
      })
    ).statusCode,
    410,
  );
  assert.deepEqual((await c.request("/trips", body)).json(), saved.json());
});

test("AC11,18: history has no five-trip cap; 30 authenticated analyses meet the fixture latency target", async (t) => {
  const c = await context();
  t.after(c.close);
  const times: number[] = [];
  for (let i = 0; i < 30; i++) {
    const started = performance.now();
    const result = await c.request("/analyses", c.input);
    times.push(performance.now() - started);
    assert.equal(result.statusCode, 201, result.body);
    if (i < 7)
      assert.equal(
        (
          await c.request("/trips", {
            analysisId: result.json().analysis.id,
            selectedRouteId: "route-b",
          })
        ).statusCode,
        201,
      );
  }
  assert.equal((await c.request("/trips?limit=5")).json().trips.length, 5);
  assert.equal((await c.request("/trips")).json().trips.length, 7);
  const secondApp = createApp(c.auth, origin, c.db);
  t.after(() => secondApp.close());
  const reloaded = await secondApp.inject({
    url: "/api/v1/trips",
    headers: { cookie: c.cookies[0] },
  });
  assert.equal(reloaded.json().trips.length, 7);
  times.sort((a, b) => a - b);
  const p50 = times[14],
    p95 = times[28];
  assert.ok(p95 !== undefined && p95 <= 2000);
  console.log(
    `AC18: 30/30 successful; p50=${p50?.toFixed(2)}ms; p95=${p95.toFixed(2)}ms; ${process.platform}; Node ${process.version}; in-process authenticated Fastify/SQLite fixture requests, excludes network/browser.`,
  );
});

test("shared snapshot validation rejects manual fabrications, incompatible quotes and corrupted saved-trip references", () => {
  const result = makeFixture("two-routes");
  assert.ok(result.ok);
  const a = result.analysis;
  assert.equal(
    analysisSchema.safeParse({
      ...a,
      inputSnapshot: {
        ...a.inputSnapshot,
        fuelSelection: {
          ...a.inputSnapshot.fuelSelection,
          brandId: "different",
        },
      },
    }).success,
    false,
  );
  assert.equal(
    analysisSchema.safeParse({
      ...a,
      inputSnapshot: {
        ...a.inputSnapshot,
        fuelSelection: { ...a.inputSnapshot.fuelSelection, gradeId: "wrong" },
      },
    }).success,
    false,
  );
  const trip = makeHistory()[0];
  assert.ok(trip);
  assert.equal(
    tripSchema.safeParse({ ...trip, recommendedRouteId: "missing" }).success,
    false,
  );
  assert.equal(
    tripSchema.safeParse({
      ...trip,
      routeSnapshots: [trip.routeSnapshots[0], trip.routeSnapshots[0]],
    }).success,
    false,
  );
  assert.equal(
    tripSchema.safeParse({ ...trip, selectedPriceSnapshot: null }).success,
    false,
  );
  const corrupt = structuredClone(trip);
  const route = corrupt.routeSnapshots[0];
  assert.ok(route);
  route.costEstimate.expectedPhp = "1";
  assert.equal(tripSchema.safeParse(corrupt).success, false);
});
