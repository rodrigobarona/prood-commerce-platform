import { beforeEach, describe, expect, it, vi } from "vitest"

const client = vi.hoisted(() => ({
  checkSlug: vi.fn(),
  create: vi.fn(),
  setActive: vi.fn(),
}))

vi.mock("@/lib/auth/client", () => ({ authClient: { organization: client } }))
vi.stubEnv("NEXT_PUBLIC_STOREFRONT_URL", "https://prood.app")

const { addressFromName, cleanAddress, createStore } = await import("../create-store")

beforeEach(() => {
  vi.clearAllMocks()
  client.checkSlug.mockResolvedValue({ data: { status: true }, error: null })
  client.create.mockResolvedValue({ data: { id: "org-1" }, error: null })
  client.setActive.mockResolvedValue({ error: null })
})

describe("store addresses", () => {
  it("turns accents into their letters", () => {
    expect(addressFromName("Grés & Companhia")).toBe("gres-companhia")
    expect(cleanAddress("Olá Mundo-")).toBe("ola-mundo-")
  })

  it("keeps the address chosen when it's free", async () => {
    await expect(createStore("Grés", "gres")).resolves.toEqual({ host: "gres.prood.app" })
    expect(client.create).toHaveBeenCalledWith({ name: "Grés", slug: "gres" })
  })

  it("only adds a suffix when the address is taken", async () => {
    client.checkSlug.mockResolvedValue({ data: null, error: { status: 400 } })
    await createStore("Grés", "gres")
    expect(client.create.mock.calls[0]?.[0].slug).toMatch(/^gres-[a-z0-9]+$/)
  })

  it("never hands out a reserved address", async () => {
    await createStore("API", "api")
    expect(client.checkSlug).not.toHaveBeenCalled()
    expect(client.create.mock.calls[0]?.[0].slug).toMatch(/^api-[a-z0-9]+$/)
  })

  it("tries once more with a suffix if the address goes while it's being claimed", async () => {
    client.create
      .mockResolvedValueOnce({ data: null, error: { code: "ORGANIZATION_ALREADY_EXISTS", message: "Taken" } })
      .mockResolvedValueOnce({ data: { id: "org-1" }, error: null })

    const result = await createStore("Grés", "gres")

    expect(client.create).toHaveBeenCalledTimes(2)
    expect(client.create.mock.calls[1]?.[0].slug).toMatch(/^gres-[a-z0-9]+$/)
    expect(result).toMatchObject({ host: expect.stringMatching(/^gres-[a-z0-9]+\.prood\.app$/) })
  })

  it("never sends anything but a-z, digits and hyphens", async () => {
    await createStore("Loja", "Loja--Nova-")
    expect(client.create.mock.calls[0]?.[0].slug).toBe("loja-nova")
    expect(addressFromName("محل")).toBe("")
  })

  it("passes on why the store couldn't be created", async () => {
    client.create.mockResolvedValue({ data: null, error: { message: "Too many stores" } })
    await expect(createStore("Grés", "gres")).resolves.toEqual({ error: "Too many stores" })
  })
})
