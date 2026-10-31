import 'server-only'
import type {
  StorageProvider,
  StorageUploadResult,
  UploadInput,
} from '@prood/types'
import { S3StorageProvider } from '@prood/storage-s3'

let cached: StorageProvider | null = null

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

/** Cloudflare R2 through its S3 API. Objects are public, served by the media Worker. */
export function getStorage(): StorageProvider {
  cached ??= new S3StorageProvider({
    endpoint: required('S3_ENDPOINT'),
    region: 'auto',
    bucket: required('S3_BUCKET'),
    accessKeyId: required('S3_ACCESS_KEY_ID'),
    secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    publicUrl: required('S3_PUBLIC_URL'),
  })
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
 * so one merchant can never overwrite another merchant's assets. Everything
 * stored here is public through the media Worker, so never store private files.
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
