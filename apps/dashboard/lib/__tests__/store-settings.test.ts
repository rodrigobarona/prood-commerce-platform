import { describe, expect, it } from "vitest"
import { contactErrors, toStoreUpdate, type SettingsFormValues } from "../store-settings"

const values: SettingsFormValues = {
  name: "Loja da Ana",
  description: "Cerâmica feita à mão",
  contactEmail: "ola@lojadaana.pt",
  contactPhone: "",
  currency: "EUR",
  timezone: "Europe/Lisbon",
  country: "PT",
  address: "",
}

describe("toStoreUpdate", () => {
  it("stores the one text where the store reads it", () => {
    expect(toStoreUpdate(values)).toMatchObject({
      name: { en: "Loja da Ana" },
      description: { en: "Cerâmica feita à mão" },
      contactEmail: "ola@lojadaana.pt",
    })
  })

  it("keeps a translation set through the API", () => {
    const update = toStoreUpdate(values, { name: { en: "Old", pt: "Loja" } })
    expect(update.name).toEqual({ en: "Loja da Ana", pt: "Loja" })
  })

  it("removes a cleared contact email and phone instead of skipping them", () => {
    const update = toStoreUpdate({ ...values, contactEmail: "", contactPhone: " " })
    expect(update.contactEmail).toBeNull()
    expect(update.contactPhone).toBeNull()
  })

  it("removes a cleared description, translations included", () => {
    const update = toStoreUpdate({ ...values, description: " " }, { description: { en: "Old", pt: "Velha" } })
    expect(update.description).toBeNull()
  })

  it("doesn't touch the store's language", () => {
    expect(toStoreUpdate(values)).not.toHaveProperty("locale")
  })
})

describe("contactErrors", () => {
  it("accepts what a merchant would really type", () => {
    expect(contactErrors({ contactEmail: "ola@lojadaana.pt", contactPhone: "+351 912 345 678" })).toEqual({})
    expect(contactErrors({ contactEmail: "", contactPhone: "(21) 123-4567" })).toEqual({})
  })

  it("explains an email without a domain ending", () => {
    expect(contactErrors({ contactEmail: "a@b", contactPhone: "" }).contactEmail).toMatch(/^We can't use that email\./)
  })

  it.each(["call me", "+351 91A 345 678", "123"])("refuses %s as a phone number", (contactPhone) => {
    expect(contactErrors({ contactEmail: "", contactPhone }).contactPhone).toMatch(/^We can't use that phone number\./)
  })
})
