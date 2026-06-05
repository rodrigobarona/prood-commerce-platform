import { z } from "zod"
import { postcodeValidator, postcodeValidatorExistsForCountry } from "postcode-validator"

export const contactSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
})

export const addressSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    street: z.string().min(1, "Street address is required"),
    street2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1, "Country is required"),
    phone: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.postalCode || !data.country) return true
      if (!postcodeValidatorExistsForCountry(data.country)) return true
      return postcodeValidator(data.postalCode, data.country)
    },
    { message: "Invalid postal code for this country", path: ["postalCode"] },
  )

export const shippingMethodSchema = z.object({
  methodId: z.string().min(1, "Select a shipping method"),
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
