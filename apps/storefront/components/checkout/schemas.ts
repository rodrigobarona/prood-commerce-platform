import { z } from "zod"
import { postcodeValidator, postcodeValidatorExistsForCountry } from "postcode-validator"

/** Hong Kong or the UAE have no postal codes, so nothing can be asked of them. */
export function usesPostalCodes(country: string): boolean {
  return postcodeValidatorExistsForCountry(country)
}

/** The validator also takes the four-digit form, which can't find a street. */
const PORTUGUESE_POSTAL_CODE = /^\d{4}-\d{3}$/

export const contactSchema = z.object({
  email: z.string().email("Enter your whole email address, like ana@casalume.example."),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
})

export const addressSchema = z
  .object({
    firstName: z.string().min(1, "Enter your first name."),
    lastName: z.string().min(1, "Enter your last name."),
    street: z.string().min(1, "Enter your street address."),
    street2: z.string().optional(),
    city: z.string().min(1, "Enter your city."),
    state: z.string().optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().min(1, "Choose your country."),
  })
  .superRefine(({ postalCode, country }, ctx) => {
    if (!usesPostalCodes(country)) return
    if (!postalCode) {
      ctx.addIssue({ code: "custom", message: "Enter your postal code.", path: ["postalCode"] })
    } else if (country === "PT" && !PORTUGUESE_POSTAL_CODE.test(postalCode)) {
      ctx.addIssue({ code: "custom", message: "We can't read that postal code. Enter all seven digits, like 1200-195.", path: ["postalCode"] })
    } else if (!postcodeValidator(postalCode, country)) {
      ctx.addIssue({
        code: "custom",
        message: "That postal code doesn't match this country. Check it, or change the country.",
        path: ["postalCode"],
      })
    }
  })

export const shippingMethodSchema = z.object({
  methodId: z.string().min(1, "Choose a shipping method, so we can work out your total."),
})

export const checkoutSchema = z.object({
  contact: contactSchema,
  address: addressSchema,
  shippingMethod: shippingMethodSchema,
  useSameForBilling: z.boolean().default(true),
})

export type ContactValues = z.infer<typeof contactSchema>
export type AddressValues = z.infer<typeof addressSchema>
export type ShippingMethodValues = z.infer<typeof shippingMethodSchema>
export type CheckoutValues = z.infer<typeof checkoutSchema>
