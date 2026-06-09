import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { authDb } from "@/lib/auth/db"
import { apikey } from "@/lib/auth/schema"
import { requireActiveOrg } from "@/lib/admin"

export interface DashboardApiKey {
  id: string
  name: string | null
  start: string | null
  enabled: boolean
  requestCount: number
  lastRequest: Date | null
  createdAt: Date
  scopes: string[]
}

function parseScopes(metadata: string | null): string[] {
  if (!metadata) return []
  try {
    const parsed = JSON.parse(metadata) as { scopes?: unknown }
    return Array.isArray(parsed.scopes)
      ? parsed.scopes.filter((scope): scope is string => typeof scope === "string")
      : []
  } catch {
    return []
  }
}

export async function listActiveOrgApiKeys(): Promise<DashboardApiKey[]> {
  const orgId = await requireActiveOrg()
  const rows = await authDb
    .select({
      id: apikey.id,
      name: apikey.name,
      start: apikey.start,
      enabled: apikey.enabled,
      requestCount: apikey.requestCount,
      lastRequest: apikey.lastRequest,
      createdAt: apikey.createdAt,
      metadata: apikey.metadata,
    })
    .from(apikey)
    .where(eq(apikey.referenceId, orgId))
    .orderBy(desc(apikey.createdAt))

  return rows.map(({ metadata, ...row }) => ({
    ...row,
    scopes: parseScopes(metadata),
  }))
}

export async function revokeActiveOrgApiKey(id: string): Promise<void> {
  const orgId = await requireActiveOrg()
  await authDb
    .update(apikey)
    .set({ enabled: false, updatedAt: new Date() })
    .where(and(eq(apikey.id, id), eq(apikey.referenceId, orgId)))
}
