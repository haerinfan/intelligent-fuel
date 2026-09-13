import type { DatabaseSync } from "node:sqlite";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";

export function createAuth(db: DatabaseSync, origin: string, secret: string) {
  return betterAuth({
    appName: "Intelligent Fuel local prototype",
    database: db,
    baseURL: origin,
    secret,
    trustedOrigins: [origin],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
    },
    session: { expiresIn: 60 * 60 * 8, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, window: 60, max: 30 },
    telemetry: { enabled: false },
    logger: { disabled: true },
  });
}
export type Auth = ReturnType<typeof createAuth>;
export async function migrateAuth(auth: Auth) {
  const migration = await getMigrations(auth.options);
  await migration.runMigrations();
}
