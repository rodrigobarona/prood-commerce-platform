import { APIError } from "better-auth/api"

/** The routes where the two-factor plugin would remember the browser for 30 days when asked. */
const VERIFY_PATHS = new Set(["/two-factor/verify-totp", "/two-factor/verify-backup-code", "/two-factor/verify-otp"])

type VerifyRoute = {
  path: string
  body?: { trustDevice?: unknown; [field: string]: unknown }
}

/**
 * Prood never remembers a device. A dashboard session is also valid at /admin, so a browser
 * that skipped the second step would skip it for platform staff too. The apps stopped
 * offering the option; this refuses a caller that sends it anyway, instead of ignoring it.
 */
export function guardTrustDevice({ path, body }: VerifyRoute): void {
  if (VERIFY_PATHS.has(path) && body?.trustDevice !== undefined && body.trustDevice !== false) {
    throw new APIError("BAD_REQUEST", { message: "Prood doesn't trust devices. Enter the code each time you sign in." })
  }
}
