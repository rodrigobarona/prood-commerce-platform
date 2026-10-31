import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SidebarProvider } from "@prood/ui/components/sidebar"

const mocks = vi.hoisted(() => ({ getStoreSettings: vi.fn() }))

vi.mock("@/lib/admin-api", () => ({ getStoreSettings: mocks.getStoreSettings }))

import { ViewStoreLink } from "../layout/view-store-link"

const STORE_URL = "https://lojadaana.pt"

const inSidebar = (element: ReactElement | null) =>
  renderToStaticMarkup(<SidebarProvider>{element}</SidebarProvider>)

beforeEach(() => {
  mocks.getStoreSettings.mockReset()
})

describe("ViewStoreLink", () => {
  it("opens the store's real address in a new tab", async () => {
    mocks.getStoreSettings.mockResolvedValue({ url: STORE_URL })
    const html = inSidebar(await ViewStoreLink())
    expect(html).toContain(`href="${STORE_URL}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain("View store")
  })

  it("leaves the sidebar alone when the address can't be read", async () => {
    mocks.getStoreSettings.mockRejectedValue(new Error("API down"))
    expect(await ViewStoreLink()).toBeNull()
  })
})
