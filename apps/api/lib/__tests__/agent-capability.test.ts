import { describe, expect, it } from "vitest"
import { assertCapability, operationForRequest } from "../agent-capability"

describe("operationForRequest", () => {
  it("maps a request to its operation", () => {
    expect(operationForRequest("GET /v1/products")).toBe("listProducts")
    expect(operationForRequest("GET /v1/products/abc")).toBe("getProduct")
    expect(operationForRequest("POST /v1/admin/orders/abc/refund")).toBe("adminRefundOrder")
  })

  it("prefers a literal path over a parameter", () => {
    expect(operationForRequest("GET /v1/products/by-slug/shirt")).toBe("getProductBySlug")
  })

  it("distinguishes methods on the same path", () => {
    expect(operationForRequest("DELETE /v1/admin/products/abc")).toBe("adminDeleteProduct")
    expect(operationForRequest("GET /v1/admin/products/abc")).toBe("adminGetProduct")
  })

  it.each([[null], ["GET /v1/not-a-route"], ["GET /products"], ["GET"]])(
    "returns null for %j",
    (target) => {
      expect(operationForRequest(target)).toBeNull()
    }
  )
})

describe("assertCapability", () => {
  it("allows a granted operation", () => {
    expect(() => assertCapability(["adminGetDashboard"], "adminGetDashboard")).not.toThrow()
  })

  it("refuses another admin operation", () => {
    expect(() => assertCapability(["adminGetDashboard"], "adminRefundOrder")).toThrow(/capability/)
  })

  it("refuses a request that maps to no operation", () => {
    expect(() => assertCapability(["adminGetDashboard"], null)).toThrow(/capability/)
  })
})
