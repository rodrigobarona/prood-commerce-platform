import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SidebarProvider } from "@prood/ui/components/sidebar"

const mocks = vi.hoisted(() => ({ getStoreUrl: vi.fn() }))

vi.mock("@/lib/store-link", () => ({ getStoreUrl: mocks.getStoreUrl }))

import { ViewStoreLink } from "../layout/view-store-link"

const STORE_URL = "https://lojadaana.pt"

const inSidebar = (element: ReactElement | null) =>
  renderToStaticMarkup(<SidebarProvider>{element}</SidebarProvider>)

beforeEach(() => {
  mocks.getStoreUrl.mockReset()
})

describe("ViewStoreLink", () => {
  it("opens the store's real address in a new tab", async () => {
    mocks.getStoreUrl.mockResolvedValue(STORE_URL)
    const html = inSidebar(await ViewStoreLink())
    expect(html).toContain(`href="${STORE_URL}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain("View store")
  })

  it("leaves the sidebar alone when the address can't be read", async () => {
    mocks.getStoreUrl.mockRejectedValue(new Error("API down"))
    expect(await ViewStoreLink()).toBeNull()
  })
})
