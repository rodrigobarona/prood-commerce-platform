import 'server-only'
import { Redis } from '@upstash/redis'
import type { CheckoutSnapshot } from '@prood/checkout'

const KEY_PREFIX = 'checkout:session:'
const DEFAULT_TTL_S = 60 * 60 * 24 // 24 hours

export interface SessionMeta {
  providerId: string
  publishableKey?: string
  kind: 'cs' | 'pl'
  returnUrl: string | null
  cancelUrl: string | null
  webhookUrl: string | null
  tenantId?: string | null
  orderId?: string | null
  customerId?: string | null
}

export interface StoredSession {
  snapshot: CheckoutSnapshot
  meta: SessionMeta
  createdAt: string
}

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
    if (!url || !token) {
      throw new Error(
        "Redis REST credentials are required. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash) or KV_REST_API_URL + KV_REST_API_TOKEN (Vercel Marketplace Redis/KV).",
      )
    }
    redis = Redis.fromEnv()
  }
  return redis
}

function key(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`
}

function computeTtl(snapshot: CheckoutSnapshot): number {
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
