import { NextRequest } from "next/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { proxy } from "../../proxy"

const request = (method: string, origin?: string) =>
  new NextRequest("https://prood.test/v1/products", { method, headers: origin ? { Origin: origin } : {} })

describe("the /v1 proxy", () => {
  it("answers a wrong method with the shape of the API", async () => {
    const response = proxy(request("DELETE"))

    expect(response.status).toBe(405)
    expect(response.headers.get("Allow")).toContain("GET")
    expect(await response.json()).toMatchObject({ code: "METHOD_NOT_ALLOWED" })
  })

  it("opens /v1 to no other origin: the docs playground is same-origin", () => {
    for (const method of ["GET", "OPTIONS"]) {
      const response = proxy(request(method, "https://prood.test"))
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull()
    }
  })
})
