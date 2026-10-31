import 'server-only'

/** Resolved commerce runtime configuration, read from environment. */
export interface CommerceConfig {
  databaseUrl: string
}

/** Read the commerce configuration from environment variables. */
export function getCommerceConfig(): CommerceConfig {
  return {
    databaseUrl: process.env.DATABASE_URL ?? '',
  }
}
