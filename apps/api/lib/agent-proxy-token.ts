import { createHmac, timingSafeEqual } from "node:crypto"
import { requiredEnv } from "@prood/types"

/**
 * When Agent Auth's execute endpoint runs a capability, it calls `/v1` itself.
 * This header carries who that call is for: the store, the agent, its user,
 * the one operation it may reach and the capabilities it holds. It's signed
 * with a key derived from `BETTER_AUTH_SECRET` and lasts a minute, so `/v1`
 * trusts it without any stored API key.
 */
export const AGENT_PROXY_HEADER = "x-prood-agent-proxy"

const TTL_MS = 60_000
const KEY_LABEL = "prood:agent-proxy:v1"

export interface AgentProxyClaims {
  orgId: string
  agentId: string
  userId?: string
  /** The operation this call may reach, and no other. */
  operation: string
  capabilities: string[]
  exp: number
}

function signingKey(): Buffer {
  const secret = requiredEnv(process.env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET")
  return createHmac("sha256", secret).update(KEY_LABEL).digest()
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url")
}

export function signAgentProxyToken(claims: Omit<AgentProxyClaims, "exp">, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ ...claims, exp: now + TTL_MS })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

function isClaims(value: unknown): value is AgentProxyClaims {
  const v = value as Partial<AgentProxyClaims> | null
  return (
    typeof v?.orgId === "string" &&
    typeof v.agentId === "string" &&
    (v.userId === undefined || typeof v.userId === "string") &&
    typeof v.operation === "string" &&
    Array.isArray(v.capabilities) &&
    v.capabilities.every((c) => typeof c === "string") &&
    typeof v.exp === "number"
  )
}

/** The claims of a valid, unexpired token, or null. */
export function verifyAgentProxyToken(token: string, now = Date.now()): AgentProxyClaims | null {
  const [payload, signature, extra] = token.split(".")
  if (!payload || !signature || extra !== undefined) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  let claims: unknown
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  } catch {
    return null
  }
  if (!isClaims(claims) || claims.exp <= now) return null
  return claims
}
