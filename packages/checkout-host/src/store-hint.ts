import 'server-only'
import { createHmac, hkdfSync } from 'node:crypto'
import { safeEqual } from '@prood/types'
import { STARTED_PAYMENT_TTL_S } from './session-store'

/**
 * Who a payment belongs to, carried in its link so a page can still say so when
 * the session can't be read: someone who may have paid shouldn't lose the store.
 * Only the store's public details, never the shopper's: URLs end up in logs. The
 * order number stays out too: it would be text on our domain that the session
 * behind it can't vouch for.
 */
export interface StoreHint {
  name: string | null
  email: string | null
  /** The store's front door, not its return address, which names the shopper. */
  home: string | null
}

/** A hint is only good for the session it was made for, and only as long as that session can last. */
interface SignedHint extends StoreHint {
  sessionId: string
  /** Seconds since the epoch. */
  exp: number
}

export const STORE_HINT_PARAM = 'store'

/** Its own key: a leaked hint key signs hints, and can't call the checkout API. */
function signingKey(): Buffer | null {
  const secret = process.env.CHECKOUT_API_SECRET?.trim()
  if (!secret) return null
  return Buffer.from(hkdfSync('sha256', secret, '', 'prood/checkout/store-hint', 32))
}

/** A secret-signed value: on our domain, an unsigned name and email would be a phishing kit. */
function signature(payload: string, key: Buffer): string {
  return createHmac('sha256', key).update(payload).digest('base64url')
}

export function signStoreHint(sessionId: string, hint: StoreHint): string | null {
  const key = signingKey()
  if (!key) return null
  const signed: SignedHint = {
    ...hint,
    sessionId,
    exp: Math.floor(Date.now() / 1000) + STARTED_PAYMENT_TTL_S,
  }
  const payload = Buffer.from(JSON.stringify(signed)).toString('base64url')
  return `${payload}.${signature(payload, key)}`
}

/** Null for anything but a live hint made for this session, so a link can't be replayed on another page. */
export function readStoreHint(token: string | string[] | undefined, sessionId: string): StoreHint | null {
  const key = signingKey()
  if (!key || typeof token !== 'string') return null
  const [payload, mark] = token.split('.')
  if (!payload || !mark || !safeEqual(mark, signature(payload, key))) return null
  try {
    const signed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SignedHint
    if (signed.sessionId !== sessionId || !(signed.exp > Date.now() / 1000)) return null
    return { name: signed.name, email: signed.email, home: signed.home }
  } catch {
    return null
  }
}
