import 'server-only'
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'

// Versioned prefix lets us recognize encrypted values and migrate formats.
// Values without the prefix are treated as plaintext (e.g. legacy rows or dev
// without an encryption key configured).
const PREFIX = 'enc:v1:'
const IV_LENGTH = 12
const TAG_LENGTH = 16

const keySource =
  process.env.INTEGRATION_ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET

let derivedKey: Buffer | null | undefined

/** Derive a stable 32-byte key from the configured secret, or null if unset. */
function getKey(): Buffer | null {
  if (derivedKey !== undefined) return derivedKey
  derivedKey = keySource
    ? scryptSync(keySource, 'commercejs.integration.v1', 32)
    : null
  return derivedKey
}

/**
 * Encrypt a secret value (AES-256-GCM). Returns plaintext unchanged when no
 * encryption key is configured (dev), so callers don't have to branch.
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  if (!key || !plaintext) return plaintext
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Decrypt a value produced by {@link encryptSecret}; passes plaintext through. */
export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value
  const key = getKey()
  if (!key) return value
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), 'base64')
    const iv = raw.subarray(0, IV_LENGTH)
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const enc = raw.subarray(IV_LENGTH + TAG_LENGTH)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
      'utf8',
    )
  } catch {
    return value
  }
}

/** Encrypt every value in a config map (for storage at rest). */
export function encryptConfig(
  config: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(config)) {
    out[key] = encryptSecret(value)
  }
  return out
}

/** Decrypt every value in a config map (read back from storage). */
export function decryptConfig(
  config: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(config)) {
    out[key] = decryptSecret(value)
  }
  return out
}
