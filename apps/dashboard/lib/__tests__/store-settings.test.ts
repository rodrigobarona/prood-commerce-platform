import { describe, expect, it } from "vitest"
import { toStoreUpdate, type SettingsFormValues } from "../store-settings"

const values: SettingsFormValues = {
  name: { en: "Loja da Ana" },
  description: { en: "Cerâmica feita à mão", pt: "" },
  contactEmail: "ola@lojadaana.pt",
  contactPhone: "",
  currency: "EUR",
  locale: "en",
  timezone: "Europe/Lisbon",
  country: "PT",
  address: "",
}

describe("toStoreUpdate", () => {
  it("keeps what the merchant filled in", () => {
    expect(toStoreUpdate(values)).toMatchObject({
      description: { en: "Cerâmica feita à mão" },
      contactEmail: "ola@lojadaana.pt",
    })
  })

  it("removes a cleared contact email instead of skipping it", () => {
    expect(toStoreUpdate({ ...values, contactEmail: "" }).contactEmail).toBeNull()
  })

  it("removes a description cleared in every language", () => {
    const description = { en: " ", pt: "", es: "" }
    expect(toStoreUpdate({ ...values, description }).description).toBeNull()
  })
})
