import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { proxy } from "../../proxy"

const DOCS = "https://docs.prood.test"

function request(method: string, origin?: string) {
  return new NextRequest("https://api.prood.test/v1/products", {
    method,
    headers: origin ? { Origin: origin } : {},
  })
}

describe("CORS on /v1", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_DOCS_URL", `${DOCS}/`))
  afterEach(() => vi.unstubAllEnvs())

  it("answers the docs' preflight, and only for the headers the playground sends", () => {
    const response = proxy(request("OPTIONS", DOCS))

    expect(response.status).toBe(204)
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(DOCS)
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Authorization, Content-Type, x-api-key, x-storefront-host")
  })

  it("never allows credentials", () => {
    expect(proxy(request("OPTIONS", DOCS)).headers.get("Access-Control-Allow-Credentials")).toBeNull()
    expect(proxy(request("GET", DOCS)).headers.get("Access-Control-Allow-Credentials")).toBeNull()
  })

  it("lets the docs read a response", () => {
    expect(proxy(request("GET", DOCS)).headers.get("Access-Control-Allow-Origin")).toBe(DOCS)
    expect(proxy(request("GET", DOCS)).headers.get("Vary")).toContain("Origin")
  })

  it.each([["https://evil.test"], ["https://docs.prood.test.evil.test"], [undefined]])(
    "gives %s nothing",
    (origin) => {
      expect(proxy(request("GET", origin)).headers.get("Access-Control-Allow-Origin")).toBeNull()
      expect(proxy(request("OPTIONS", origin)).headers.get("Access-Control-Allow-Origin")).toBeNull()
    }
  )

  it("stays off when no docs address is set", () => {
    vi.stubEnv("NEXT_PUBLIC_DOCS_URL", "")
    expect(proxy(request("GET", DOCS)).headers.get("Access-Control-Allow-Origin")).toBeNull()
  })
})
