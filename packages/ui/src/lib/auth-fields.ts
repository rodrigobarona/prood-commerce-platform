/** Sign-in and password fields, checked in Prood's words and shown beside the field. */
export const MIN_PASSWORD = 8
export const PASSWORD_HINT = `At least ${MIN_PASSWORD} characters.`

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailError(email: string): string | undefined {
  if (!email.trim()) return "Enter your email address."
  if (!EMAIL.test(email.trim())) {
    return "We can't use that email. It looks incomplete. Enter the whole address, like ana@casalume.example."
  }
  return undefined
}

export function newPasswordError(password: string): string | undefined {
  if (password.length >= MIN_PASSWORD) return undefined
  return `We can't use that password. It's under ${MIN_PASSWORD} characters. Choose a longer one.`
}
