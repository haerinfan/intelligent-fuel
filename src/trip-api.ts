import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Auth } from "./auth.js";
import {
  type Analysis,
  analysisRequestSchema,
  analysisSchema,
  CONTRACT_VERSION,
  manualVehicleSchema,
  type PlannedTrip,
  tripSchema,
  type VehicleSnapshot,
  vehicleSnapshotSchema,
} from "./contracts/index.js";
import { calculateCost } from "./domain/cost.js";
import {
  DEMO_NOTICE,
  fixtureDestination,
  fixtureOrigin,
  fixtureVehicles,
  makeFixture,
  SCENARIOS,
} from "./fixtures/index.js";

export const demoLocations = [
  fixtureOrigin,
  fixtureDestination,
  {
    ...fixtureDestination,
    label: "Synthetic Cavite-area third stop",
    latitude: 14.35,
    longitude: 120.97,
  },
];
const brands = [
  { id: "demo-fuel-a", label: "Demo Fuel A" },
  { id: "demo-fuel-b", label: "Demo Fuel B" },
];
const brandSchema = z.enum(["demo-fuel-a", "demo-fuel-b"]);
const identifier = z.string().min(1).max(160);
const createVehicleSchema = z.union([
  z.strictObject({ catalogVehicleId: identifier }),
  z.strictObject({
    manual: z.strictObject({
      label: z.string().trim().min(1).max(100),
      fuelType: z.enum(["gasoline", "diesel"]).nullable(),
    }),
  }),
]);
const preferencesSchema = z.strictObject({
  defaultVehicleId: identifier.optional(),
  brandId: brandSchema.optional(),
});
const requestSchema = analysisRequestSchema.extend({
  scenario: z.enum(SCENARIOS).default("two-routes"),
  simulateDelay: z.boolean().optional(),
});
const saveSchema = z.strictObject({
  analysisId: identifier,
  selectedRouteId: identifier,
  simulateFailure: z.boolean().optional(),
});
type SavedVehicle = {
  id: string;
  vehicleSnapshot: VehicleSnapshot;
  createdAt: string;
};
type Stored = { payload: string };
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = false,
    public fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}
const notFound = () =>
  new ApiError(404, "NOT_FOUND", "This record is not available.");

export function migrateTrips(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS garage (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS garage_owner ON garage(owner_id);
    CREATE TABLE IF NOT EXISTS preferences (
      owner_id TEXT PRIMARY KEY, default_vehicle_id TEXT, brand_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS analyses_owner ON analyses(owner_id);
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, analysis_id TEXT NOT NULL,
      created_at TEXT NOT NULL, payload TEXT NOT NULL,
      UNIQUE(owner_id, analysis_id)
    );
    CREATE INDEX IF NOT EXISTS trips_owner_time ON trips(owner_id, created_at DESC, id DESC);
  `);
}

export function mapsUrl(trip: PlannedTrip) {
  const { origin, destination } = trip.inputSnapshot;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  url.searchParams.set(
    "destination",
    `${destination.latitude},${destination.longitude}`,
  );
  url.searchParams.set("travelmode", "driving");
  // Fictional route geometry is not a Google route ID or a permitted real waypoint.
  return url.toString();
}

export function registerTripApi(
  app: FastifyInstance,
  auth: Auth,
  origin: string,
  db: DatabaseSync,
  clock: () => Date = () => new Date(),
) {
  migrateTrips(db);
  const getVehicle = (owner: string, id: string): SavedVehicle => {
    const row = db
      .prepare("SELECT payload FROM garage WHERE owner_id = ? AND id = ?")
      .get(owner, id) as Stored | undefined;
    if (!row) throw notFound();
    const stored = JSON.parse(row.payload) as SavedVehicle;
    return {
      ...stored,
      vehicleSnapshot: vehicleSnapshotSchema.parse(stored.vehicleSnapshot),
    };
  };
  const getPreferences = (owner: string) => {
    const row = db
      .prepare(
        "SELECT default_vehicle_id, brand_id FROM preferences WHERE owner_id = ?",
      )
      .get(owner) as
      | { default_vehicle_id: string | null; brand_id: string }
      | undefined;
    return {
      defaultVehicleId: row?.default_vehicle_id ?? null,
      brandId: row?.brand_id ?? "demo-fuel-a",
    };
  };
  app.register(
    async (api) => {
      api.addHook("preSerialization", async (_request, _reply, payload) => {
        if (payload && typeof payload === "object" && !Array.isArray(payload))
          return { ...payload, schemaVersion: CONTRACT_VERSION };
        return payload;
      });
      api.addHook("onRequest", async (request, reply) => {
        reply.header("cache-control", "no-store");
        if (
          !["GET", "HEAD"].includes(request.method) &&
          request.headers.origin !== origin
        )
          throw new ApiError(
            403,
            "ORIGIN_REJECTED",
            "Request origin is not allowed.",
          );
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
        });
        if (!session)
          throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
        // The identity comes exclusively from the verified session.
        owners.set(request, session.user.id);
      });
      const owners = new WeakMap<object, string>();
      const owner = (request: object) => {
        const id = owners.get(request);
        if (!id)
          throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
        return id;
      };
      api.setErrorHandler((error, request, reply) => {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            schemaVersion: CONTRACT_VERSION,
            error: {
              code: "INVALID_INPUT",
              message: "Check the highlighted fields.",
              retryable: false,
              fieldErrors: error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
              })),
            },
            requestId: request.id,
          });
        }
        const safe =
          error instanceof ApiError
            ? error
            : new ApiError(
                500,
                "INTERNAL_ERROR",
                "The request could not be completed.",
              );
        return reply.code(safe.status).send({
          schemaVersion: CONTRACT_VERSION,
          error: {
            code: safe.code,
            message: safe.message,
            retryable: safe.retryable,
            fieldErrors: safe.fieldErrors,
          },
          requestId: request.id,
        });
      });
      api.get("/bootstrap", async () => ({
        schemaVersion: CONTRACT_VERSION,
        catalog: fixtureVehicles,
        locations: demoLocations,
        brands,
        scenarios: SCENARIOS,
        notice: DEMO_NOTICE,
      }));
      api.get("/garage", async (request) => ({
        vehicles: (
          db
            .prepare(
              "SELECT payload FROM garage WHERE owner_id = ? ORDER BY rowid",
            )
            .all(owner(request)) as Stored[]
        ).map((r) => JSON.parse(r.payload)),
        preferences: getPreferences(owner(request)),
      }));
      api.post("/garage", async (request, reply) => {
        const input = createVehicleSchema.parse(request.body);
        const now = clock().toISOString();
        let snapshot: VehicleSnapshot;
        if ("catalogVehicleId" in input) {
          const found = fixtureVehicles.find(
            (v) => v.id === input.catalogVehicleId,
          );
          if (!found)
            throw new ApiError(
              400,
              "INVALID_INPUT",
              "Choose a catalog variant or add a manual vehicle.",
              false,
              [{ field: "catalogVehicleId", message: "Variant not found." }],
            );
          snapshot = found;
        } else {
          snapshot = manualVehicleSchema.parse({
            id: randomUUID(),
            kind: "manual",
            model: input.manual.label,
            fuelType: input.manual.fuelType,
            market: null,
            brand: null,
            modelYear: null,
            variant: null,
            vehicleClass: null,
            displacementCc: null,
            transmission: null,
            compatibleGrades: null,
            ratedKmPerLiter: null,
            provenance: {
              mode: "user_reported",
              sourceName: "Manual vehicle entry (unverified)",
              sourceUrl: null,
              observedAt: null,
              retrievedAt: now,
              sourceVersion: "manual-v1",
              retentionPolicyId: "local-user-entry-v1",
            },
          });
        }
        const vehicle: SavedVehicle = {
          id: randomUUID(),
          vehicleSnapshot: snapshot,
          createdAt: now,
        };
        db.exec("BEGIN IMMEDIATE");
        try {
          db.prepare("INSERT INTO garage VALUES (?, ?, ?)").run(
            vehicle.id,
            owner(request),
            JSON.stringify(vehicle),
          );
          db.prepare(
            "INSERT INTO preferences VALUES (?, ?, ?) ON CONFLICT(owner_id) DO UPDATE SET default_vehicle_id = COALESCE(default_vehicle_id, excluded.default_vehicle_id)",
          ).run(owner(request), vehicle.id, "demo-fuel-a");
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return reply.code(201).send({ vehicle });
      });
      api.get<{ Params: { id: string } }>("/garage/:id", async (request) => ({
        vehicle: getVehicle(owner(request), request.params.id),
      }));
      api.delete<{ Params: { id: string } }>("/garage/:id", async (request) => {
        getVehicle(owner(request), request.params.id);
        db.exec("BEGIN IMMEDIATE");
        try {
          db.prepare("DELETE FROM garage WHERE owner_id = ? AND id = ?").run(
            owner(request),
            request.params.id,
          );
          db.prepare(
            "UPDATE preferences SET default_vehicle_id = NULL WHERE owner_id = ? AND default_vehicle_id = ?",
          ).run(owner(request), request.params.id);
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return { deleted: true };
      });
      api.patch("/preferences", async (request) => {
        const input = preferencesSchema.parse(request.body);
        if (input.defaultVehicleId)
          getVehicle(owner(request), input.defaultVehicleId);
        const previous = getPreferences(owner(request));
        db.prepare(
          "INSERT INTO preferences VALUES (?, ?, ?) ON CONFLICT(owner_id) DO UPDATE SET default_vehicle_id=excluded.default_vehicle_id, brand_id=excluded.brand_id",
        ).run(
          owner(request),
          input.defaultVehicleId ?? previous.defaultVehicleId,
          input.brandId ?? previous.brandId,
        );
        return { preferences: getPreferences(owner(request)) };
      });
      api.post("/analyses", async (request, reply) => {
        const input = requestSchema.parse(request.body);
        brandSchema.parse(input.fuelSelection.brandId);
        const saved = getVehicle(owner(request), input.savedVehicleId);
        const sameLocation = (
          a: z.infer<typeof analysisRequestSchema>["origin"],
          b: z.infer<typeof analysisRequestSchema>["origin"],
        ) =>
          a.latitude === b.latitude &&
          a.longitude === b.longitude &&
          a.label === b.label &&
          a.resolutionSource === b.resolutionSource &&
          a.providerPlaceId === b.providerPlaceId;
        for (const field of ["origin", "destination"] as const) {
          if (!demoLocations.some((l) => sameLocation(l, input[field])))
            throw new ApiError(
              400,
              "UNRESOLVED_LOCATION",
              "Choose a resolved demo location.",
              false,
              [{ field, message: "Select one of the listed demo locations." }],
            );
        }
        if (sameLocation(input.origin, input.destination))
          throw new ApiError(
            400,
            "INVALID_INPUT",
            "Origin and destination must differ.",
            false,
            [
              {
                field: "destination",
                message: "Choose a different destination.",
              },
            ],
          );
        if (!sameLocation(input.origin, input.priceLocation))
          throw new ApiError(
            400,
            "INVALID_INPUT",
            "Price basis must be the origin area.",
            false,
            [{ field: "priceLocation", message: "Use the origin area." }],
          );
        const vehicle = saved.vehicleSnapshot;
        if (
          (vehicle.fuelType !== null &&
            vehicle.fuelType !== input.fuelSelection.fuelType) ||
          (vehicle.compatibleGrades !== null &&
            !vehicle.compatibleGrades.includes(
              input.fuelSelection.gradeId ?? "",
            ))
        )
          throw new ApiError(
            400,
            "INCOMPATIBLE_FUEL",
            "Fuel type or grade is incompatible with the vehicle.",
            false,
            [
              {
                field: "fuelSelection",
                message: "Choose a compatible fuel and grade.",
              },
            ],
          );
        const result = makeFixture(input.scenario, {
          ownerId: owner(request),
          id: randomUUID(),
          now: clock(),
        });
        if (!result.ok)
          throw new ApiError(
            result.error.retryable ? 503 : 422,
            result.error.code,
            result.error.message,
            result.error.retryable,
          );
        const analysis = result.analysis;
        const {
          scenario: _scenario,
          simulateDelay: _delay,
          ...submitted
        } = input;
        analysis.inputSnapshot = { ...submitted, vehicleSnapshot: vehicle };
        // Fixture prices are authored by scenario; selected brand controls cost only.
        const price = analysis.selectedPriceSnapshot;
        if (price) {
          price.observation.id = `quote-${analysis.id}`;
          price.observation.brandId =
            input.scenario === "general-price"
              ? null
              : input.fuelSelection.brandId;
          price.observation.fuelType = input.fuelSelection.fuelType;
          price.observation.gradeId = input.fuelSelection.gradeId;
          price.observation.geographyLabel = `${input.origin.label} — synthetic price basis`;
          if (price.observation.amountPhpPerLiter !== null)
            price.observation.amountPhpPerLiter =
              input.fuelSelection.brandId === "demo-fuel-b" ? "80.00" : "78.00";
        }
        if (vehicle.kind === "manual") {
          analysis.selectedPriceSnapshot = null;
          for (const r of analysis.routes)
            r.fuelEstimate = {
              ...r.fuelEstimate,
              status: "unavailable",
              expectedLiters: null,
              range: null,
              reason:
                "Manual vehicle is unsupported; specifications remain unknown.",
            };
          analysis.recommendation = {
            ...analysis.recommendation,
            status: "unavailable",
            routeId: null,
            reasonCode: "PREDICTION_UNAVAILABLE",
            explanation:
              "Manual vehicle: compare route distance and time; fuel prediction is unavailable.",
          };
        }
        for (const r of analysis.routes)
          r.costEstimate = calculateCost(
            r.fuelEstimate,
            analysis.selectedPriceSnapshot,
          );
        analysis.warnings.push(
          "Illustrative routes only. Google Maps cannot reproduce these fictional alternatives and may update the route.",
        );
        const validated = analysisSchema.parse(analysis);
        if (input.simulateDelay)
          await new Promise((resolve) => setTimeout(resolve, 1000));
        db.prepare("INSERT INTO analyses VALUES (?, ?, ?)").run(
          validated.id,
          owner(request),
          JSON.stringify(validated),
        );
        return reply.code(201).send({ analysis: validated });
      });
      api.get<{ Params: { id: string } }>("/analyses/:id", async (request) => {
        const row = db
          .prepare("SELECT payload FROM analyses WHERE owner_id = ? AND id = ?")
          .get(owner(request), request.params.id) as Stored | undefined;
        if (!row) throw notFound();
        return { analysis: analysisSchema.parse(JSON.parse(row.payload)) };
      });
      api.post("/trips", async (request, reply) => {
        const input = saveSchema.parse(request.body);
        const userId = owner(request);
        db.exec("BEGIN IMMEDIATE");
        let trip: PlannedTrip;
        let created = false;
        try {
          const existing = db
            .prepare(
              "SELECT payload FROM trips WHERE owner_id = ? AND analysis_id = ?",
            )
            .get(userId, input.analysisId) as Stored | undefined;
          if (existing) {
            trip = tripSchema.parse(JSON.parse(existing.payload));
            if (trip.selectedRouteId !== input.selectedRouteId)
              throw new ApiError(
                409,
                "SELECTION_CONFLICT",
                "This analysis was already saved with a different route. Analyze again for a new trip.",
              );
          } else {
            const row = db
              .prepare(
                "SELECT payload FROM analyses WHERE owner_id = ? AND id = ?",
              )
              .get(userId, input.analysisId) as Stored | undefined;
            if (!row) throw notFound();
            const a: Analysis = analysisSchema.parse(JSON.parse(row.payload));
            if (Date.parse(a.expiresAt) <= clock().getTime())
              throw new ApiError(
                410,
                "ANALYSIS_EXPIRED",
                "This analysis expired. Analyze again before saving.",
              );
            if (!a.routes.some((r) => r.route.id === input.selectedRouteId))
              throw new ApiError(
                400,
                "INVALID_INPUT",
                "Select a returned route.",
                false,
                [
                  {
                    field: "selectedRouteId",
                    message: "Route not returned by this analysis.",
                  },
                ],
              );
            if (input.simulateFailure)
              throw new ApiError(
                503,
                "DEMO_SAVE_FAILURE",
                "Simulated save failure. Nothing was saved; retry is safe.",
                true,
              );
            trip = tripSchema.parse({
              id: randomUUID(),
              ownerId: userId,
              analysisId: a.id,
              schemaVersion: CONTRACT_VERSION,
              createdAt: clock().toISOString(),
              inputSnapshot: a.inputSnapshot,
              recommendedRouteId: a.recommendation.routeId,
              selectedRouteId: input.selectedRouteId,
              routeSnapshots: a.routes,
              selectedPriceSnapshot: a.selectedPriceSnapshot,
              status: "planned",
              promptDismissedAt: null,
              handoffRequestedAt: clock().toISOString(),
              analysisCreatedAt: a.createdAt,
              recommendationSnapshot: a.recommendation,
              warnings: a.warnings,
            });
            db.prepare("INSERT INTO trips VALUES (?, ?, ?, ?, ?)").run(
              trip.id,
              userId,
              a.id,
              trip.createdAt,
              JSON.stringify(trip),
            );
            created = true;
          }
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return reply
          .code(created ? 201 : 200)
          .send({ trip, mapsUrl: mapsUrl(trip) });
      });
      api.get("/trips", async (request) => {
        const query = z
          .strictObject({
            limit: z.coerce.number().int().min(1).max(100).optional(),
          })
          .parse(request.query);
        const statement = query.limit
          ? db.prepare(
              "SELECT payload FROM trips WHERE owner_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
            )
          : db.prepare(
              "SELECT payload FROM trips WHERE owner_id = ? ORDER BY created_at DESC, id DESC",
            );
        const rows = (
          query.limit
            ? statement.all(owner(request), query.limit)
            : statement.all(owner(request))
        ) as Stored[];
        return {
          trips: rows.map((r) => tripSchema.parse(JSON.parse(r.payload))),
        };
      });
      api.get<{ Params: { id: string } }>("/trips/:id", async (request) => {
        const row = db
          .prepare("SELECT payload FROM trips WHERE owner_id = ? AND id = ?")
          .get(owner(request), request.params.id) as Stored | undefined;
        if (!row) throw notFound();
        const trip = tripSchema.parse(JSON.parse(row.payload));
        return { trip, mapsUrl: mapsUrl(trip) };
      });
    },
    { prefix: "/api/v1" },
  );
}
