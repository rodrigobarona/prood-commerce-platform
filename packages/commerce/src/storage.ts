import 'server-only'
import type {
  StorageProvider,
  StorageUploadResult,
  UploadInput,
} from '@commercejs/types'
import { VercelBlobStorageProvider } from '@commercejs/storage-vercel-blob'
import { S3StorageProvider } from '@commercejs/storage-s3'
import { getCommerceConfig } from './env'

let cached: StorageProvider | null = null

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for STORAGE_PROVIDER=s3`)
  return value
}

/**
 * Get the configured storage provider (singleton).
 * - `vercel-blob` (default): Vercel Blob via BLOB_READ_WRITE_TOKEN
 * - `s3`: any S3-compatible store (AWS, Cloudflare R2, MinIO, ...)
 */
export function getStorage(): StorageProvider {
  if (cached) return cached

  const { storageProvider } = getCommerceConfig()

  if (storageProvider === 's3') {
    cached = new S3StorageProvider({
      endpoint: required('S3_ENDPOINT'),
      region: process.env.S3_REGION ?? 'auto',
      bucket: required('S3_BUCKET'),
      accessKeyId: required('S3_ACCESS_KEY_ID'),
      secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
      publicUrl: process.env.S3_PUBLIC_URL,
    })
  } else {
    // addRandomSuffix makes public blob URLs unguessable (defense-in-depth on
    // top of per-tenant key namespacing).
    cached = new VercelBlobStorageProvider({ addRandomSuffix: true })
  }

  return cached
}

/**
 * Namespace a storage directory under a tenant so uploaded keys never collide
 * or leak across organizations. Always use this (or {@link uploadForTenant})
 * for any merchant-uploaded asset.
 */
export function tenantStorageDirectory(
  organizationId: string,
  subdirectory?: string,
): string {
  const base = `org/${organizationId}`
  if (!subdirectory) return base
  return `${base}/${subdirectory.replace(/^\/+|\/+$/g, '')}`
}

/**
 * Upload a file scoped to a tenant. Keys are prefixed with `org/<orgId>/...`
 * so one merchant can never overwrite or read another merchant's assets.
 */
export async function uploadForTenant(
  organizationId: string,
  input: UploadInput,
): Promise<StorageUploadResult> {
  return getStorage().upload({
    ...input,
    directory: tenantStorageDirectory(organizationId, input.directory),
  })
}
