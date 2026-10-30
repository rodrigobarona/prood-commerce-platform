import { describe, expect, expectTypeOf, it } from "vitest"
import { createCommerceApiClient, unwrap } from "../index"

function clientReturning(response: Response) {
  return createCommerceApiClient({
    baseUrl: "https://api.test/v1",
    fetch: () => Promise.resolve(response),
  })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("unwrap", () => {
  it("returns the success body, typed from the operation", async () => {
    const api = clientReturning(json({ status: "ok" }))
    const health = await unwrap(api.GET("/health"))
    expectTypeOf(health).toEqualTypeOf<{ status: "ok" }>()
    expect(health).toEqual({ status: "ok" })
  })

  it("resolves a 204 to nothing instead of treating it as empty", async () => {
    const api = clientReturning(new Response(null, { status: 204 }))
    const deleted = await unwrap(
      api.DELETE("/admin/products/{id}", { params: { path: { id: "p1" } } })
    )
    expectTypeOf(deleted).toEqualTypeOf<void>()
    expect(deleted).toBeUndefined()
  })

  it("throws the API error body", async () => {
    const body = { code: "FORBIDDEN", message: "Nope" }
    const api = clientReturning(json(body, 403))
    await expect(unwrap(api.GET("/me"))).rejects.toEqual(body)
  })

  it("throws when a body was expected but none came", async () => {
    const api = clientReturning(
      new Response(null, { status: 200, headers: { "content-length": "0" } })
    )
    await expect(unwrap(api.GET("/me"))).rejects.toThrow("Empty API response")
  })
})
