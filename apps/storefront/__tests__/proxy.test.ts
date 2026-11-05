import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ lookupTenantByHost: vi.fn() }))

vi.mock("@prood/platform", () => ({ DEMO_ORG_ID: "org_demo", lookupTenantByHost: mocks.lookupTenantByHost }))

import { proxy } from "../proxy"

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`http://loja.localhost:3000${path}`, { headers: { host: "loja.localhost:3000", ...headers } })

/** The path the store's route tree was asked for. */
const rewrittenTo = (response: Response) => {
  const rewrite = response.headers.get("x-middleware-rewrite")
  return rewrite ? new URL(rewrite).pathname : null
}

function stubApi(respond: (url: string) => Response) {
  const fn = vi.fn(async (input: Request) => respond(input.url))
  vi.stubGlobal("fetch", fn)
  return fn
}

beforeEach(() => {
  vi.stubEnv("COMMERCE_API_URL", "http://api.test/v1")
  vi.stubEnv("NEXT_PUBLIC_PLATFORM_DOMAIN", "prood.test")
  vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://prood.test.com")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("proxy", () => {
  it("serves each store from the route tree under its host", async () => {
    stubApi(() => Response.json({}))
    expect(rewrittenTo(await proxy(request("/")))).toBe("/loja.localhost")
    expect(rewrittenTo(await proxy(request("/cart")))).toBe("/loja.localhost/cart")
  })

  it("keeps the query string", async () => {
    const response = await proxy(request("/products?sort=price-asc"))
    expect(new URL(response.headers.get("x-middleware-rewrite")!).search).toBe("?sort=price-asc")
  })

  it("leaves Route Handlers alone", async () => {
    expect(rewrittenTo(await proxy(request("/api/commerce/cart")))).toBeNull()
  })

  it("sends the bare platform domain to marketing, but lets the storefront be told to revalidate", async () => {
    const bare = (path: string) => new NextRequest(`http://prood.test${path}`, { headers: { host: "prood.test" } })
    expect((await proxy(bare("/"))).headers.get("location")).toBe("https://prood.test.com/")
    expect(rewrittenTo(await proxy(bare("/api/revalidate")))).toBeNull()
    expect((await proxy(bare("/api/revalidate"))).headers.get("location")).toBeNull()
  })

  it("answers a product that doesn't exist with the not-found page", async () => {
    stubApi(() => Response.json({ code: "NOT_FOUND", message: "No." }, { status: 404 }))
    expect(rewrittenTo(await proxy(request("/products/nope")))).toBe("/loja.localhost/not-found")
  })

  it("lets a real product through", async () => {
    stubApi(() => Response.json({ id: "p1" }))
    expect(rewrittenTo(await proxy(request("/products/taca")))).toBe("/loja.localhost/products/taca")
  })

  it("answers a category that doesn't exist with the not-found page", async () => {
    stubApi(() => Response.json([{ slug: "mesa" }]))
    expect(rewrittenTo(await proxy(request("/categories/nope")))).toBe("/loja.localhost/not-found")
    expect(rewrittenTo(await proxy(request("/categories/mesa")))).toBe("/loja.localhost/categories/mesa")
  })

  it("won't call a page missing because the API is down", async () => {
    stubApi(() => {
      throw new Error("connect ECONNREFUSED")
    })
    expect(rewrittenTo(await proxy(request("/products/taca")))).toBe("/loja.localhost/products/taca")
  })

  describe("policy pages", () => {
    it("answers a policy no store has, whichever store is asked", async () => {
      expect(rewrittenTo(await proxy(request("/policies/nope")))).toBe("/loja.localhost/not-found")
      expect(mocks.lookupTenantByHost).not.toHaveBeenCalled()
    })

    it("answers a real store's policy page with the not-found page", async () => {
      mocks.lookupTenantByHost.mockResolvedValue("org_real")
      expect(rewrittenTo(await proxy(request("/policies/terms")))).toBe("/loja.localhost/not-found")
    })

    it("lets the demo's policies through", async () => {
      mocks.lookupTenantByHost.mockResolvedValue("org_demo")
      const demo = new NextRequest("http://demo.localhost:3000/policies/terms", { headers: { host: "demo.localhost:3000" } })
      expect(rewrittenTo(await proxy(demo))).toBe("/demo.localhost/policies/terms")
    })
  })

  describe("Markdown for agents", () => {
    it("serves a page's .md URL as Markdown", async () => {
      expect(rewrittenTo(await proxy(request("/products/taca.md")))).toBe("/loja.localhost/md/products/taca")
      expect(rewrittenTo(await proxy(request("/index.md")))).toBe("/loja.localhost/md")
    })

    it("serves Markdown to a client that asks for it first", async () => {
      const agent = request("/categories/mesa", { accept: "text/markdown, text/html;q=0.8" })
      expect(rewrittenTo(await proxy(agent))).toBe("/loja.localhost/md/categories/mesa")
    })

    it("keeps HTML for browsers, and for pages with no Markdown version", async () => {
      stubApi(() => Response.json({ id: "p1" }))
      const browser = request("/products/taca", { accept: "text/html,application/xhtml+xml,*/*;q=0.8" })
      expect(rewrittenTo(await proxy(browser))).toBe("/loja.localhost/products/taca")
      expect(rewrittenTo(await proxy(request("/cart", { accept: "text/markdown" })))).toBe("/loja.localhost/cart")
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
