import { beforeEach, describe, expect, it, vi } from "vitest"

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }))
const cookie = vi.hoisted(() => ({ getCartId: vi.fn(), setCartId: vi.fn() }))

vi.mock("@/lib/commerce-api", () => ({ getCommerceApi: async () => api }))
vi.mock("@/lib/cart-cookie", () => cookie)

import { POST } from "../route"

const refused = {
  error: { code: "VALIDATION", message: "Linen Shirt is out of stock." },
  response: new Response(null, { status: 422 }),
}
const notFound = (message: string) => ({
  error: { code: "NOT_FOUND", message },
  response: new Response(null, { status: 404 }),
})
const created = (id: string) => ({ data: { id }, response: new Response(null, { status: 201 }) })
const added = (id: string) => ({ data: { id, items: [] }, response: new Response(null, { status: 201 }) })

function addRequest() {
  return new Request("http://store.test/api/commerce/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId: "prod-1", quantity: 1 }),
  })
}

/** Script POST /carts and POST /carts/{id}/items by path. */
function respond(onAdd: (cartId: string) => unknown) {
  api.POST.mockImplementation(async (path: string, init?: { params: { path: { id: string } } }) =>
    path === "/carts" ? created("cart-new") : onAdd(init!.params.path.id),
  )
}

describe("POST /api/commerce/cart/items", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    cookie.getCartId.mockResolvedValue("cart-old")
  })

  it("keeps the shopper's cart when the add is refused", async () => {
    respond(() => refused)

    const res = await POST(addRequest())

    expect(res.status).toBe(422)
    expect((await res.json()).message).toBe("Linen Shirt is out of stock.")
    expect(api.POST).not.toHaveBeenCalledWith("/carts")
    expect(cookie.setCartId).not.toHaveBeenCalled()
  })

  it("keeps the shopper's cart when the product is what's missing", async () => {
    respond(() => notFound("Product not found: prod-1"))
    api.GET.mockResolvedValue({ data: { id: "cart-old" }, response: new Response(null, { status: 200 }) })

    const res = await POST(addRequest())

    expect(res.status).toBe(404)
    expect(api.POST).not.toHaveBeenCalledWith("/carts")
    expect(cookie.setCartId).not.toHaveBeenCalled()
  })

  it("replaces a cart that is really gone and adds to the new one", async () => {
    respond((id) => (id === "cart-old" ? notFound("Cart not found: cart-old") : added("cart-new")))
    api.GET.mockResolvedValue(notFound("Cart not found: cart-old"))

    const res = await POST(addRequest())

    expect(res.status).toBe(200)
    expect((await res.json()).cart.id).toBe("cart-new")
    expect(cookie.setCartId).toHaveBeenCalledWith("cart-new")
  })

  it("creates a cart for a shopper without one", async () => {
    cookie.getCartId.mockResolvedValue(null)
    respond(() => added("cart-new"))

    const res = await POST(addRequest())

    expect((await res.json()).cart.id).toBe("cart-new")
    expect(cookie.setCartId).toHaveBeenCalledWith("cart-new")
  })
})
