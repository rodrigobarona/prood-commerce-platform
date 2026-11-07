export type PasskeyEnv = Record<string, string | undefined>

/** What the passkey plugin needs: the relying party and the exact origins that may use it. */
export interface PasskeyConfig {
  rpID: string
  origin: string[]
}

function parseOrigin(value: string): URL {
  try {
    const url = new URL(value)
    if (url.origin === "null" || url.origin !== value.replace(/\/+$/, "")) throw new Error("not an origin")
    return url
  } catch {
    throw new Error(`PASSKEY_ORIGINS has "${value}", which is not an origin. Use https://host with no path, like https://dashboard.prood.com.`)
  }
}

/**
 * Passkeys are off until they are configured on purpose. A WebAuthn relying party
 * ID must be a registrable domain suffix of the page origin, and `*.vercel.app` is a
 * public suffix, so no ID works there. Guessing one would only fail in the browser.
 *
 * Returns `null` when both variables are empty. Throws when only one is set, or when
 * an origin is not the ID or a subdomain of it, so a typo stops the server at start.
 */
export function resolvePasskeyConfig(env: PasskeyEnv = process.env): PasskeyConfig | null {
  const rpID = env.PASSKEY_RP_ID?.trim().toLowerCase() ?? ""
  const origins = (env.PASSKEY_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (!rpID && origins.length === 0) return null
  if (!rpID) throw new Error("PASSKEY_ORIGINS is set but PASSKEY_RP_ID is not. Set both to turn passkeys on, or neither.")
  if (origins.length === 0) throw new Error("PASSKEY_RP_ID is set but PASSKEY_ORIGINS is not. Set both to turn passkeys on, or neither.")
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(rpID)) {
    throw new Error(`PASSKEY_RP_ID is "${rpID}". Use a bare domain like prood.com, with no scheme, port or path.`)
  }

  const exact = origins.map((value) => {
    const url = parseOrigin(value)
    const host = url.hostname
    if (host !== rpID && !host.endsWith(`.${rpID}`)) {
      throw new Error(`PASSKEY_ORIGINS has ${url.origin}, which is not under PASSKEY_RP_ID ${rpID}.`)
    }
    return url.origin
  })

  return { rpID, origin: [...new Set(exact)] }
}

/** For the dashboard and admin, which only decide whether to show the passkey buttons. */
export function isPasskeyEnabled(env: PasskeyEnv = process.env): boolean {
  return resolvePasskeyConfig(env) !== null
}
