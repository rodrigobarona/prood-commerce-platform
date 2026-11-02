import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ lookupTenantByHost: vi.fn() }))

vi.mock("@prood/platform", () => ({ DEMO_ORG_ID: "org_demo", lookupTenantByHost: mocks.lookupTenantByHost }))

import { proxy } from "../proxy"

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`http://loja.localhost:3000${path}`, { headers: { host: "loja.localhost:3000", ...headers } })

const rewrittenTo = (response: Response) => response.headers.get("x-middleware-rewrite")

function stubApi(respond: (url: string) => Response) {
  const fn = vi.fn(async (input: Request) => respond(input.url))
  vi.stubGlobal("fetch", fn)
  return fn
}

beforeEach(() => {
  vi.stubEnv("COMMERCE_API_URL", "http://api.test/v1")
  vi.stubEnv("NEXT_PUBLIC_PLATFORM_DOMAIN", "prood.test")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("proxy", () => {
  it("answers a product that doesn't exist with the not-found page", async () => {
    stubApi(() => Response.json({ code: "NOT_FOUND", message: "No." }, { status: 404 }))
    expect(rewrittenTo(await proxy(request("/products/nope")))).toContain("/not-found")
  })

  it("lets a real product through", async () => {
    stubApi(() => Response.json({ id: "p1" }))
    expect(rewrittenTo(await proxy(request("/products/taca")))).toBeNull()
  })

  it("answers a category that doesn't exist with the not-found page", async () => {
    stubApi(() => Response.json([{ slug: "mesa" }]))
    expect(rewrittenTo(await proxy(request("/categories/nope")))).toContain("/not-found")
    expect(rewrittenTo(await proxy(request("/categories/mesa")))).toBeNull()
  })

  it("won't call a page missing because the API is down", async () => {
    stubApi(() => {
      throw new Error("connect ECONNREFUSED")
    })
    expect(rewrittenTo(await proxy(request("/products/taca")))).toBeNull()
  })

  describe("policy pages", () => {
    it("answers a policy no store has, whichever store is asked", async () => {
      expect(rewrittenTo(await proxy(request("/policies/nope")))).toContain("/not-found")
      expect(mocks.lookupTenantByHost).not.toHaveBeenCalled()
    })

    it("answers a real store's policy page with the not-found page", async () => {
      mocks.lookupTenantByHost.mockResolvedValue("org_real")
      expect(rewrittenTo(await proxy(request("/policies/terms")))).toContain("/not-found")
    })

    it("lets the demo's policies through", async () => {
      mocks.lookupTenantByHost.mockResolvedValue("org_demo")
      const demo = new NextRequest("http://demo.localhost:3000/policies/terms", { headers: { host: "demo.localhost:3000" } })
      expect(rewrittenTo(await proxy(demo))).toBeNull()
    })
  })

  it("skips the lookup for in-app navigation, which doesn't need the status", async () => {
    const api = stubApi(() => Response.json({}))
    await proxy(request("/products/taca", { "sec-fetch-dest": "empty" }))
    expect(api).not.toHaveBeenCalled()
  })

  it("leaves the rest of the store alone", async () => {
    const api = stubApi(() => Response.json({}))
    await proxy(request("/cart"))
    expect(api).not.toHaveBeenCalled()
  })
})
