/** Sign-in and sign-up errors in Prood's words. What Better Auth says is written for developers. */

interface AuthError {
  code?: string
  status: number
}

const EXISTING_ACCOUNT = new Set(["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"])

export function signInErrorMessage(error: AuthError): string {
  if (error.status === 429) {
    return "We couldn't sign you in. There were too many attempts. Wait a minute and try again."
  }
  if (error.code === "BANNED_USER") {
    return "We couldn't sign you in. This account is banned. Email hello@prood.com to talk about it."
  }
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "We couldn't sign you in. That email and password don't match. Try again or reset your password."
  }
  return "We couldn't sign you in. Something went wrong on our side. Try again in a moment."
}

export function isExistingAccount(error: AuthError): boolean {
  return EXISTING_ACCOUNT.has(error.code ?? "")
}

export function signUpErrorMessage(error: AuthError): string {
  if (isExistingAccount(error)) return "We couldn't create your account. That email already has one."
  if (error.status === 429) {
    return "We couldn't create your account. There were too many attempts. Wait a minute and try again."
  }
  if (error.code === "PASSWORD_TOO_SHORT") {
    return "We couldn't create your account. That password is too short. Use at least 8 characters."
  }
  return "We couldn't create your account. Check your details and try again."
}
