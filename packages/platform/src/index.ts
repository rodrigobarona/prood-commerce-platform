// ---------------------------------------------------------------------------
// @prood/platform — native commerce engine
// ---------------------------------------------------------------------------
// Own your data. No external platform required.
// ---------------------------------------------------------------------------

// Adapter
export { createPlatformAdapter } from './adapter.js'
export type { PlatformAdapterResult } from './adapter.js'

// Admin API
export { createAdminAPI } from './admin/index.js'
export type { AdminAPI } from './admin/types.js'
export type {
  AdminUser,
  AdminUserSafe,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  AdminListOrdersParams,
  FulfillOrderInput,
  UpdateStoreInput,
  StoreSettings,
  UpdateInventoryInput,
  DashboardStats,
  AdminListParams,
} from './admin/types.js'

// Config
export type { PlatformConfig } from './types.js'

// Database (Drizzle + Neon serverless WebSocket Pool)
export {
  initDrizzle,
  getDrizzleDb,
  getDb,
  withTenant,
  getCurrentOrganizationId,
  currentTenantScope,
  migrateDrizzle,
  applyTenantIsolation,
  seedDrizzle,
  DEMO_ORG_ID,
} from './database/index.js'
export {
  ensureCustomerForAuthUser,
  ensureGuestCustomer,
  resolveCustomerIdForAuthUser,
  linkAuthUserToCustomer,
  autoLinkGuestCustomers,
} from './customers/identity.js'
export { lookupTenantByHost } from './tenant/lookup.js'
export {
  ensureDefaultStoreInfo,
  provisionOrganizationStore,
} from './tenant/store-info.js'
export { countProducts, countOrdersThisMonth } from './database/index.js'
export type { DrizzleDatabase } from './database/drizzle/client.js'

// Drizzle schema (for raw queries)
export * as schema from './database/drizzle/schema/index.js'

// Domain factories (for standalone use outside the adapter)
export { createCartDomain } from './domains/cart.js'
export { createCheckoutDomain } from './domains/checkout.js'
export { createCatalogDomain } from './domains/catalog.js'
export { createOrdersDomain } from './domains/orders.js'
