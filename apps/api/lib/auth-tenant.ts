import "server-only"
import { headers } from "next/headers"
import {
  requireCallerFromHeaders,
  resolveCallerFromHeaders,
} from "@/lib/resolve-caller"
import type { ApiScope } from "@/lib/scopes"

export type { ApiScope }

export interface ApiCaller {
  orgId: string
  scopes: ApiScope[]
  via: "api-key" | "session" | "host" | "agent"
  /** Better Auth user id — used only server-side to resolve commerce customer UUID */
  userId?: string
  /** Operations an agent was granted. Agents can only use these, whatever their scopes. */
  capabilities?: string[]
  /** The agent behind the call, for the audit log. */
  agentId?: string
  /** The user the agent acts for, for the audit log. */
  actorId?: string
  /** Sent by Agent Auth's execute endpoint, which records the call itself. */
  proxied?: boolean
}

export async function resolveApiCaller(): Promise<ApiCaller | null> {
  return resolveCallerFromHeaders(await headers())
}

export async function requireCaller(scope: ApiScope): Promise<ApiCaller> {
  return requireCallerFromHeaders(await headers(), scope)
}
