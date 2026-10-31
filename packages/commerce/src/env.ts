import 'server-only'

/** Storage provider identifiers. */
export type StorageProviderId = 'vercel-blob' | 's3'

/** Resolved commerce runtime configuration, read from environment. */
export interface CommerceConfig {
  databaseUrl: string
  storageProvider: StorageProviderId
}

/** Read the commerce configuration from environment variables. */
export function getCommerceConfig(): CommerceConfig {
  return {
    databaseUrl: process.env.DATABASE_URL ?? '',
    storageProvider: (process.env.STORAGE_PROVIDER as StorageProviderId) ?? 'vercel-blob',
  }
}
