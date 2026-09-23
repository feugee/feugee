import { describe, expect, it, vi } from "vitest"

import { readinessHandler } from "./health"
import type { PayloadRequest } from "payload"

const requestWithDb = (execute: (query: unknown) => Promise<unknown>) =>
  ({
    payload: {
      db: { drizzle: { execute } },
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

describe("readinessHandler", () => {
  it("answers 200 ok when the database answers", async () => {
    const req = requestWithDb(vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }))

    const res = await readinessHandler(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ status: "ok" })
  })

  it("answers 503 and logs when the database is unreachable", async () => {
    const execute = vi.fn().mockRejectedValue(new Error("connection refused"))
    const req = requestWithDb(execute)

    const res = await readinessHandler(req)

    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toEqual({ status: "unavailable" })
    expect(req.payload.logger.error).toHaveBeenCalled()
  })

  it("probes the database with a trivial query", async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [] })
    await readinessHandler(requestWithDb(execute))

    expect(execute).toHaveBeenCalledTimes(1)
  })
})
