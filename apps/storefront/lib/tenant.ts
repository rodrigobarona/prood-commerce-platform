import "server-only"

/**
 * The organization (tenant) id whose store this request is serving.
 *
 * Multi-tenant routing maps the request host to a store — `{slug}.{platform}`
 * subdomains and custom domains each resolve to an organization. That mapping
 * (via the Vercel SDK + a tenant_domains table) is wired in the domains phase.
 *
 * Until then, resolution returns DEFAULT_TENANT_ORG_ID (matching the seeded
 * demo store) so the storefront renders in development without per-request
 * host reads — which keeps catalog pages cacheable per tenant.
 */
const DEFAULT_TENANT_ORG_ID = process.env.DEFAULT_TENANT_ORG_ID ?? "org_demo"

/** Resolve the active tenant (organization id) for the current request. */
export async function resolveTenantId(): Promise<string> {
  return DEFAULT_TENANT_ORG_ID
}
