import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock("@/app/(dashboard)/settings/actions", () => ({ updateStoreSettingsAction: vi.fn() }))

import { SettingsForm } from "../store/settings-form"

const initial = {
  name: { en: "Loja da Ana" },
  description: {},
  contactEmail: "",
  contactPhone: "",
  currency: "EUR",
  locale: "en",
  timezone: "Europe/Lisbon",
  country: "PT",
  address: "",
}

describe("SettingsForm", () => {
  it("says the description and contact email are public", () => {
    const html = renderToStaticMarkup(<SettingsForm initial={initial} />)
    expect(html.match(/Shown on your store and to customers\./g)).toHaveLength(2)
  })
})
