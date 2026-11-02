import { emailError, newPasswordError } from "@prood/ui/lib/auth-fields"

export interface SignUpFields {
  name: string
  storeName: string
  email: string
  password: string
}

export type SignUpErrors = Partial<Record<keyof SignUpFields, string>>

/** In Prood's words and beside the field, not in the browser's bubbles. */
export function signUpErrors(fields: SignUpFields, { needsStore }: { needsStore: boolean }): SignUpErrors {
  const errors: SignUpErrors = {}
  if (!fields.name.trim()) errors.name = "Add your name, so your team knows who you are."
  if (needsStore && !fields.storeName.trim()) errors.storeName = storeNameError
  const email = emailError(fields.email)
  if (email) errors.email = email
  const password = newPasswordError(fields.password)
  if (password) errors.password = password
  return errors
}

export const storeNameError = "Name your store. Customers see this, and you can change it later."
