// ---------------------------------------------------------------------------
// Database barrel export
// ---------------------------------------------------------------------------

// Drizzle (Neon serverless WebSocket Pool)
export { initDrizzle, getDb as getDrizzleDb } from './drizzle/client.js'
export { getDb, withTenant, getCurrentOrganizationId, currentTenantScope } from './drizzle/client.js'
export type { DrizzleDatabase } from './drizzle/client.js'
export { migrateDrizzle, applyTenantIsolation } from './drizzle/migrate.js'
export { seedDrizzle, DEMO_ORG_ID } from './drizzle/seed.js'

// Queries
export * from './drizzle/queries/index.js'

