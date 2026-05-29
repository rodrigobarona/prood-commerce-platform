import 'server-only'
import {
  createPlatformAdapter,
  withTenant,
  type AdminAPI,
} from '@commercejs/platform'
import type { CommerceAdapter } from '@commercejs/types'
import { getCommerceConfig } from './env'

// Re-export the admin API surface so apps (e.g. the dashboard) can type
// merchant operations without depending on @commercejs/platform directly.
export type {
  AdminAPI,
  AdminUserSafe,
  AdminListParams,
  AdminListOrdersParams,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  FulfillOrderInput,
  UpdateStoreInput,
  StoreSettings,
  UpdateInventoryInput,
  DashboardStats,
} from '@commercejs/platform'

/**
 * Run commerce/admin operations scoped to a tenant (organization).
 *
 * Opens a DB transaction with `app.current_org_id` set so row-level security
 * filters every query by organization. Use this around any data access in a
 * multi-tenant request:
 *
 * ```ts
 * const admin = await getAdmin()
 * const products = await withTenant(orgId, () => admin.listProducts())
 * ```
 */
export { withTenant }

/**
 * Run `fn` scoped to `tenantId` when provided, else run it unscoped.
 *
 * Lets storefront data functions accept an optional `tenantId`: pass it to
 * isolate the query by organization (RLS), or omit it for unscoped/legacy use
 * (e.g. the hosted checkout app). Safe to call inside a `'use cache'` scope
 * because `tenantId` is a plain argument, not request-time dynamic data.
 */
export async function runScoped<T>(
  tenantId: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return tenantId ? withTenant(tenantId, fn) : fn()
}

interface CommerceInstance {
  adapter: CommerceAdapter
  admin: AdminAPI
}

// Singleton promise — the adapter (and its DB connection) is created once
// per server runtime and shared across requests.
let instancePromise: Promise<CommerceInstance> | null = null

function create(): Promise<CommerceInstance> {
  const config = getCommerceConfig()

  switch (config.adapter) {
    case 'platform':
      return createPlatformAdapter({
        connectionString: config.databaseUrl,
        currency: config.currency,
      })
    case 'medusa':
    case 'salla':
      // The registry is intentionally pluggable: drop in @commercejs/adapter-*
      // here to swap the backing platform without touching the data layer.
      throw new Error(
        `COMMERCE_ADAPTER='${config.adapter}' is not wired in this app yet. ` +
          `Add the corresponding adapter package and register it in adapter.ts.`,
      )
    default: {
      const exhaustive: never = config.adapter
      throw new Error(`Unknown COMMERCE_ADAPTER: ${String(exhaustive)}`)
    }
  }
}

/** Get the shared commerce instance (adapter + admin), creating it lazily. */
export function getCommerce(): Promise<CommerceInstance> {
  if (!instancePromise) {
    instancePromise = create().catch((err) => {
      // Reset so a transient failure (e.g. cold DB) can be retried.
      instancePromise = null
      throw err
    })
  }
  return instancePromise
}

/** Get the storefront commerce adapter. */
export async function getAdapter(): Promise<CommerceAdapter> {
  return (await getCommerce()).adapter
}

/** Get the platform admin API (merchant operations). */
export async function getAdmin(): Promise<AdminAPI> {
  return (await getCommerce()).admin
}
