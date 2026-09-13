import { fromNodeHeaders } from "better-auth/node";
import Fastify from "fastify";
import type { Auth } from "./auth.js";
import { CONTRACT_VERSION } from "./contracts/index.js";

export function createApp(auth: Auth, origin: string) {
  const app = Fastify({
    logger: false,
    bodyLimit: 32 * 1024,
    requestTimeout: 10_000,
  });
  app.get("/health", async () => ({
    status: "ok",
    service: "intelligent-fuel",
    milestone: "M1",
    schemaVersion: CONTRACT_VERSION,
    mode: "local-fixture",
    mlModelLoaded: false,
  }));
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      // Use configured origin, not a client-controlled Host header.
      const req = new Request(new URL(request.url, origin), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(request.method !== "GET" && request.body !== undefined
          ? { body: JSON.stringify(request.body) }
          : {}),
      });
      const response = await auth.handler(req);
      reply.code(response.status);
      for (const [key, value] of response.headers)
        if (key.toLowerCase() !== "set-cookie") reply.header(key, value);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header("set-cookie", cookies);
      return reply.send(await response.text());
    },
  });
  app.get("/api/v1/me", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session)
      return reply.code(401).send({
        schemaVersion: CONTRACT_VERSION,
        error: {
          code: "UNAUTHENTICATED",
          message: "Sign in to continue.",
          fieldErrors: [],
          retryable: false,
        },
        requestId: request.id,
      });
    reply.header("cache-control", "no-store");
    return {
      schemaVersion: CONTRACT_VERSION,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    };
  });
  app.setErrorHandler((_error, request, reply) => {
    const candidate =
      typeof _error === "object" && _error !== null && "statusCode" in _error
        ? _error.statusCode
        : null;
    const status =
      typeof candidate === "number" && candidate >= 400 && candidate < 500
        ? candidate
        : 500;
    reply.code(status).send({
      schemaVersion: CONTRACT_VERSION,
      error: {
        code: status < 500 ? "INVALID_INPUT" : "INTERNAL_ERROR",
        message:
          status < 500
            ? "The request could not be accepted."
            : "The request could not be completed.",
        fieldErrors: [],
        retryable: false,
      },
      requestId: request.id,
    });
  });
  return app;
}
