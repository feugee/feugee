import { sql } from "drizzle-orm"

import type { Endpoint, PayloadRequest } from "payload"

// Readiness, not liveness: the probe is only green once the app can answer a
// trivial database query, so the platform (Coolify health check, Docker
// HEALTHCHECK) stops routing requests to a container whose Postgres is down.
export const readinessHandler = async (
  req: PayloadRequest,
): Promise<Response> => {
  try {
    await req.payload.db.drizzle.execute(sql`select 1`)
    return Response.json({ status: "ok" })
  } catch (error) {
    req.payload.logger.error(`Readiness probe failed: ${error}`)
    return Response.json({ status: "unavailable" }, { status: 503 })
  }
}

export const healthEndpoint: Endpoint = {
  path: "/health",
  method: "get",
  handler: readinessHandler,
}
