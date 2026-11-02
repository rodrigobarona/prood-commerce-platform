export interface AuthFields {
  name?: string
  email: string
  password: string
}

export type AuthErrors = Partial<Record<keyof AuthFields, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

function emailError(email: string): string | undefined {
  return EMAIL.test(email.trim()) ? undefined : "Enter your whole email address, like ana@casalume.example."
}

/** Sign-in only checks what's there: a password that's right is right, whatever its length. */
export function signInErrors({ email, password }: AuthFields): AuthErrors {
  const errors: AuthErrors = {}
  const badEmail = emailError(email)
  if (badEmail) errors.email = badEmail
  if (!password) errors.password = "Enter your password."
  return errors
}

export function registerErrors({ name, email, password }: AuthFields): AuthErrors {
  const errors: AuthErrors = {}
  if (!name?.trim()) errors.name = "Enter your name."
  const badEmail = emailError(email)
  if (badEmail) errors.email = badEmail
  if (password.length < MIN_PASSWORD) errors.password = `Choose a password of at least ${MIN_PASSWORD} characters.`
  return errors
}

export function resetLinkErrors(email: string): AuthErrors {
  const badEmail = emailError(email)
  return badEmail ? { email: badEmail } : {}
}

export type ResetPasswordErrors = Partial<Record<"password" | "confirmPassword", string>>

export function resetPasswordErrors(password: string, confirmPassword: string): ResetPasswordErrors {
  const errors: ResetPasswordErrors = {}
  if (password.length < MIN_PASSWORD) errors.password = `Choose a password of at least ${MIN_PASSWORD} characters.`
  if (password !== confirmPassword) errors.confirmPassword = "Enter the same password in both fields."
  return errors
}

/** Lands the shopper on the first thing to fix. Returns whether there's anything to fix. */
export function focusFirstError(errors: Record<string, string | undefined>): boolean {
  const first = Object.keys(errors)[0]
  if (first) document.getElementById(first)?.focus()
  return Boolean(first)
}
