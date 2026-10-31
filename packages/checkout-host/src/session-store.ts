import 'server-only'
import { Redis } from '@upstash/redis'
import type { CheckoutSnapshot } from '@prood/checkout'
import type { PaymentMethodKind } from '@prood/types'

const KEY_PREFIX = 'checkout:session:'
const DEFAULT_TTL_S = 60 * 60 * 24 // 24 hours
// A Multibanco reference stays payable for days after the link that made it expires.
const STARTED_PAYMENT_TTL_S = 60 * 60 * 24 * 7 // 7 days

export interface SessionMeta {
  providerId: string
  publishableKey?: string
  kind: 'cs' | 'pl'
  returnUrl: string | null
  cancelUrl: string | null
  webhookUrl: string | null
  tenantId: string
  orderId?: string | null
  customerId?: string | null
  storeName?: string | null
  /** Methods the shopper can choose between, from the connected provider. */
  methods: PaymentMethodKind[]
}

export interface StoredSession {
  snapshot: CheckoutSnapshot
  meta: SessionMeta
  createdAt: string
}

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    // Provisioned by the Vercel Marketplace Upstash integration.
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    if (!url || !token) {
      throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN are required for checkout sessions')
    }
    redis = new Redis({ url, token })
  }
  return redis
}

function key(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`
}

function computeTtl(snapshot: CheckoutSnapshot): number {
  if (snapshot.paymentSession) return STARTED_PAYMENT_TTL_S
  if (snapshot.expiresAt) {
    const remaining = Math.ceil((new Date(snapshot.expiresAt).getTime() - Date.now()) / 1000)
    return Math.max(remaining, 60)
  }
  return DEFAULT_TTL_S
}

export async function saveSession(
  sessionId: string,
  snapshot: CheckoutSnapshot,
  meta: SessionMeta,
): Promise<void> {
  const record: StoredSession = {
    snapshot,
    meta,
    createdAt: new Date().toISOString(),
  }
  const ttl = computeTtl(snapshot)
  await getRedis().set(key(sessionId), JSON.stringify(record), { ex: ttl })
}

export async function loadSession(sessionId: string): Promise<StoredSession | null> {
  const raw = await getRedis().get<string>(key(sessionId))
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) as StoredSession : raw as unknown as StoredSession
}

export async function deleteSession(sessionId: string): Promise<void> {
  await getRedis().del(key(sessionId))
}
