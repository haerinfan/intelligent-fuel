import { resolve } from "node:path";
import { z } from "zod";

const envSchema = z.object({
  APP_ORIGIN: z.url().default("http://127.0.0.1:3000"),
  DATABASE_PATH: z.string().min(1).default("./private-data/development.sqlite"),
  BETTER_AUTH_SECRET: z.string().min(32),
});
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.parse(env);
  const origin = new URL(parsed.APP_ORIGIN);
  if (
    origin.protocol !== "http:" ||
    origin.hostname !== "127.0.0.1" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error(
      "M1 is local-only: APP_ORIGIN must be http://127.0.0.1 with an optional port.",
    );
  }
  if (parsed.BETTER_AUTH_SECRET.startsWith("replace-with"))
    throw new Error("Run npm run setup to generate a local secret.");
  return {
    origin: origin.origin,
    port: Number(origin.port || "80"),
    databasePath: resolve(parsed.DATABASE_PATH),
    secret: parsed.BETTER_AUTH_SECRET,
  };
}
