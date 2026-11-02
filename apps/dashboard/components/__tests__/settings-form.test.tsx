import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("@/app/(dashboard)/settings/actions", () => ({ updateStoreSettingsAction: vi.fn() }))

import { SettingsForm } from "../store/settings-form"

const initial = {
  name: "Loja da Ana",
  description: "",
  contactEmail: "",
  contactPhone: "",
  currency: "EUR",
  timezone: "Europe/Lisbon",
  country: "PT",
  address: "",
}

describe("SettingsForm", () => {
  it("has no language setting and one name field", () => {
    const html = renderToStaticMarkup(<SettingsForm initial={initial} currencyLocked={false} />)
    expect(html).not.toContain('role="tablist"')
    expect(html).not.toContain(">Language<")
    expect(html.match(/id="store-name"/g)).toHaveLength(1)
  })

  it("says the description and contact email are public", () => {
    const html = renderToStaticMarkup(<SettingsForm initial={initial} currencyLocked={false} />)
    expect(html.match(/Shown on your store and to customers\./g)).toHaveLength(2)
  })
})
