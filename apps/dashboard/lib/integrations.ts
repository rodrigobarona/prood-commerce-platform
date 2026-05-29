import "server-only"
import { and, eq } from "drizzle-orm"
import { authDb } from "@/lib/auth/db"
import { integrationConfig } from "@/lib/auth/schema"

export interface IntegrationState {
  provider: string
  enabled: boolean
  config: Record<string, string>
}

/** All configured integrations for a tenant, keyed by provider id. */
export async function listIntegrations(
  orgId: string
): Promise<Map<string, IntegrationState>> {
  const rows = await authDb
    .select()
    .from(integrationConfig)
    .where(eq(integrationConfig.organizationId, orgId))
  return new Map(
    rows.map((row) => [
      row.provider,
      { provider: row.provider, enabled: row.enabled, config: row.config },
    ])
  )
}

/** A single provider's config for a tenant, or null if never configured. */
export async function getIntegration(
  orgId: string,
  provider: string
): Promise<IntegrationState | null> {
  const [row] = await authDb
    .select()
    .from(integrationConfig)
    .where(
      and(
        eq(integrationConfig.organizationId, orgId),
        eq(integrationConfig.provider, provider)
      )
    )
  return row
    ? { provider: row.provider, enabled: row.enabled, config: row.config }
    : null
}

/** Create or update a tenant's config for a provider. */
export async function upsertIntegration(
  orgId: string,
  provider: string,
  config: Record<string, string>,
  enabled: boolean
): Promise<void> {
  await authDb
    .insert(integrationConfig)
    .values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      provider,
      config,
      enabled,
    })
    .onConflictDoUpdate({
      target: [integrationConfig.organizationId, integrationConfig.provider],
      set: { config, enabled, updatedAt: new Date() },
    })
}

/** Remove a tenant's config for a provider. */
export async function deleteIntegration(
  orgId: string,
  provider: string
): Promise<void> {
  await authDb
    .delete(integrationConfig)
    .where(
      and(
        eq(integrationConfig.organizationId, orgId),
        eq(integrationConfig.provider, provider)
      )
    )
}
