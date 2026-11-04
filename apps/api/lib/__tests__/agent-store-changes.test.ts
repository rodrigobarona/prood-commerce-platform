import { describe, expect, it } from "vitest"
import { changesStore, isFreshSignIn } from "@prood/auth/agent-capabilities"
import { buildOpenApiDocument } from "../openapi"

const operations = Object.values(
  (buildOpenApiDocument() as unknown as { paths: Record<string, Record<string, { operationId?: string }>> }).paths
).flatMap((item) =>
  Object.entries(item).flatMap(([method, operation]) =>
    operation.operationId ? [{ method: method.toUpperCase(), id: operation.operationId }] : []
  )
)

describe("capabilities that change the store", () => {
  it("are exactly the admin operations that aren't reads", () => {
    for (const { method, id } of operations) {
      expect([id, changesStore(id)]).toEqual([id, id.startsWith("admin") && method !== "GET"])
    }
  })

  it("include refunds, cancellations and price changes", () => {
    expect(changesStore("adminRefundOrder")).toBe(true)
    expect(changesStore("adminCancelOrder")).toBe(true)
    expect(changesStore("adminUpdateProduct")).toBe(true)
    expect(changesStore("adminGetOrder")).toBe(false)
    expect(changesStore("placeOrder")).toBe(false)
  })
})

describe("a fresh sign-in", () => {
  const now = new Date("2026-11-04T12:00:00Z")

  it("is one from the last 10 minutes", () => {
    expect(isFreshSignIn(new Date("2026-11-04T11:50:00Z"), now)).toBe(true)
    expect(isFreshSignIn(new Date("2026-11-04T11:49:59Z"), now)).toBe(false)
  })
})
