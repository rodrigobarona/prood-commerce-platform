import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ revalidateTag: vi.fn() }))

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }))

import { POST } from "../route"

const SECRET = "s3cret"

function request(body: unknown, authorization = `Bearer ${SECRET}`) {
  return new Request("https://loja.prood.test/api/revalidate", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STOREFRONT_REVALIDATE_SECRET", SECRET)
})

describe("POST /api/revalidate", () => {
  it("expires the named caches of that one store", async () => {
    const res = await POST(request({ tenantId: "org_1", tags: ["products", "categories"] }))
    expect(res.status).toBe(200)
    expect(mocks.revalidateTag.mock.calls).toEqual([
      ["products-org_1", { expire: 0 }],
      ["categories-org_1", { expire: 0 }],
    ])
  })

  it("refuses a caller without the secret", async () => {
    expect((await POST(request({ tenantId: "org_1", tags: ["store"] }, "Bearer wrong"))).status).toBe(401)
    expect((await POST(request({ tenantId: "org_1", tags: ["store"] }, ""))).status).toBe(401)
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })

  it("expires nothing it doesn't know", async () => {
    expect((await POST(request({ tenantId: "org_1", tags: ["everything"] }))).status).toBe(400)
    expect((await POST(request({ tags: ["store"] }))).status).toBe(400)
    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })
})
