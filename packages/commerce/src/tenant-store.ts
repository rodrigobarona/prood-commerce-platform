import 'server-only'
import { provisionOrganizationStore as provisionOrganizationStorePlatform } from '@prood/platform'
import { getCommerce } from './adapter'

export interface ProvisionOrganizationStoreOptions {
  name?: string
}

/** Provision the default store_info row for an organization (idempotent). */
export async function provisionOrganizationStore(
  organizationId: string,
  options: ProvisionOrganizationStoreOptions = {},
): Promise<void> {
  await getCommerce()
  await provisionOrganizationStorePlatform(organizationId, options)
}
