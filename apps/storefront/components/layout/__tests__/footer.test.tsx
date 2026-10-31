import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ fetchStoreInfo: vi.fn() }))

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }))
vi.mock("@/lib/commerce-data", () => ({ fetchStoreInfo: mocks.fetchStoreInfo }))

import { Footer } from "../footer"

const store = {
  name: { en: "Loja da Ana" },
  description: { en: "Cerâmica feita à mão" },
  contactEmail: "ola@lojadaana.pt",
}

afterEach(cleanup)

describe("Footer", () => {
  it("shows the store's name, description and contact email", async () => {
    mocks.fetchStoreInfo.mockResolvedValue(store)
    render(await Footer())
    expect(screen.getByText("Loja da Ana")).toBeTruthy()
    expect(screen.getByText("Cerâmica feita à mão")).toBeTruthy()
    expect(screen.getByRole("link", { name: "ola@lojadaana.pt" }).getAttribute("href")).toBe(
      "mailto:ola@lojadaana.pt",
    )
    expect(screen.getByText(/Loja da Ana\. All rights reserved\./)).toBeTruthy()
  })

  it("has no template copy and no newsletter column", async () => {
    mocks.fetchStoreInfo.mockResolvedValue(store)
    const { container } = render(await Footer())
    expect(container.textContent).not.toMatch(/Commerce|Newsletter|Next\.js/)
  })

  it("leaves out contact details the store hasn't set", async () => {
    mocks.fetchStoreInfo.mockResolvedValue({ ...store, description: null, contactEmail: null })
    const { container } = render(await Footer())
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
  })

  it("still renders the links when the store can't be read", async () => {
    mocks.fetchStoreInfo.mockRejectedValue(new Error("API down"))
    const { container } = render(await Footer())
    expect(screen.getByRole("link", { name: "All products" })).toBeTruthy()
    expect(container.textContent).not.toMatch(/All rights reserved/)
  })
})
