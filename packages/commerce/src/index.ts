// ---------------------------------------------------------------------------
// @workspace/commerce — server-only commerce data layer
// ---------------------------------------------------------------------------
// Wraps the pluggable Commerce.js adapter (platform/Neon by default), the
// payment provider registry, and the storage provider behind typed functions
// for use in Next.js Server Components, Server Actions, and Route Handlers.
// ---------------------------------------------------------------------------
import 'server-only'

export * from './env'
export * from './adapter'
export * from './catalog'
export * from './cart'
export * from './checkout'
export * from './payments'
export * from './integrations'
export * from './crypto'
export * from './storage'
export * from './errors'
export * from './revalidate'

// Re-export the unified domain model for convenience (includes the
// CommerceError class + isCommerceError guard as runtime values).
export * from '@commercejs/types'
