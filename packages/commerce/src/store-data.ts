import 'server-only'
import {
  deleteStoreData as deleteStoreDataPlatform,
  exportStoreData as exportStoreDataPlatform,
  unlinkAuthUserFromCustomers as unlinkAuthUserFromCustomersPlatform,
} from '@prood/platform'
import { getCommerce } from './adapter'

/** Every row a store owns, by table: the export a merchant downloads. */
export async function exportStoreData(organizationId: string): Promise<Record<string, unknown[]>> {
  await getCommerce()
  return exportStoreDataPlatform(organizationId)
}

/** Deletes everything a store owns, or nothing. Returns the row counts removed. */
export async function deleteStoreData(organizationId: string): Promise<Record<string, number>> {
  await getCommerce()
  return deleteStoreDataPlatform(organizationId)
}

/** Cuts the link between a deleted sign-in account and the customer rows it was attached to, in every store. */
export async function unlinkAuthUserFromCustomers(authUserId: string): Promise<number> {
  await getCommerce()
  return unlinkAuthUserFromCustomersPlatform(authUserId)
}
