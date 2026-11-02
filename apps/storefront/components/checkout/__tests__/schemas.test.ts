import { describe, expect, it } from "vitest"
import { addressSchema } from "../schemas"

const address = { firstName: "Ana", lastName: "Teste", street: "Rua das Flores 12", city: "Lisboa", country: "PT" }

function postalError(values: Record<string, string>) {
  const result = addressSchema.safeParse({ ...address, ...values })
  return result.error?.issues.find((issue) => issue.path[0] === "postalCode")?.message
}

describe("addressSchema", () => {
  it("asks for a postal code where the country uses them", () => {
    const missing = "Enter your postal code."
    expect(postalError({ postalCode: "" })).toBe(missing)
    expect(postalError({ postalCode: "   " })).toBe(missing)
    expect(postalError({})).toBe(missing)
  })

  it("checks the code against the country", () => {
    expect(postalError({ postalCode: "1200-195" })).toBeUndefined()
    expect(postalError({ postalCode: " 1200-195 " })).toBeUndefined()
    expect(postalError({ postalCode: "ABC" })).toBe("We can't read that postal code. Enter all seven digits, like 1200-195.")
    expect(postalError({ postalCode: "1200-195", country: "ES" })).toMatch(/doesn't match this country/)
  })

  it("wants the whole Portuguese code", () => {
    expect(postalError({ postalCode: "1200" })).toBe("We can't read that postal code. Enter all seven digits, like 1200-195.")
  })

  it("asks nothing of a country without postal codes", () => {
    expect(postalError({ country: "HK" })).toBeUndefined()
    expect(postalError({ country: "HK", postalCode: "anything" })).toBeUndefined()
  })
})
