import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: vi.fn() }))

import { getCommerceApiOrigin } from "../commerce-api"

afterEach(() => vi.unstubAllEnvs())

describe("the API origin for routes outside /v1", () => {
  it("drops the /v1 the client's base URL ends with, so /api/store/export is not requested as /v1/api/store/export", () => {
    vi.stubEnv("COMMERCE_API_URL", "https://api.prood.com/v1")
    expect(getCommerceApiOrigin()).toBe("https://api.prood.com")
  })

  it("is the same with a trailing slash or a local port", () => {
    vi.stubEnv("COMMERCE_API_URL", "http://localhost:3005/v1/")
    expect(getCommerceApiOrigin()).toBe("http://localhost:3005")
  })
})
