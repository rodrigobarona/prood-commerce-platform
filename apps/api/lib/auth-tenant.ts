import "server-only"
import { headers } from "next/headers"
import {
  requireCallerFromHeaders,
  resolveCallerFromHeaders,
} from "@/lib/resolve-caller"

/** Coarse-grained capability a route requires of the caller. */
export type ApiScope = "storefront" | "admin"

export interface ApiCaller {
  orgId: string
  scopes: ApiScope[]
  via: "api-key" | "session" | "host" | "agent"
  /** Better Auth user id — used only server-side to resolve commerce customer UUID */
  userId?: string
  /** Operations an agent was granted. Agents can only use these, whatever their scopes. */
  capabilities?: string[]
}

export async function resolveApiCaller(): Promise<ApiCaller | null> {
  return resolveCallerFromHeaders(await headers())
}

export async function requireCaller(scope: ApiScope): Promise<ApiCaller> {
  return requireCallerFromHeaders(await headers(), scope)
}
