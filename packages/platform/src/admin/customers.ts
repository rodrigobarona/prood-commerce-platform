// ---------------------------------------------------------------------------
// Admin: Customer management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Address, PaginatedResult } from '@prood/types'
import type { AdminCustomerRecord, AdminListParams } from './types.js'
import {
  adminFindAllCustomers,
  adminFindCustomerById,
  adminDeleteCustomer,
  findAddresses,
  findAddressesByCustomers,
} from '../database/index.js'

function mapAddress(row: Record<string, unknown>): Address {
  return {
    id: String(row.id),
    firstName: String(row.firstName ?? row.first_name),
    lastName: String(row.lastName ?? row.last_name),
    phone: (row.phone as string | null) ?? null,
    street: String(row.street),
    street2: (row.street2 as string | null) ?? null,
    city: String(row.city),
    state: (row.state as string | null) ?? null,
    country: String(row.country),
    postalCode: (row.postalCode as string | null) ?? (row.postal_code as string | null) ?? null,
    isDefault: Boolean(row.isDefault ?? row.is_default),
  }
}

type CustomerRow = {
  id: string
  authUserId?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  defaultAddressId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  userEmail?: string | null
  orderCount: number
  spent: number
}

function mapCustomer(row: CustomerRow, addresses: Record<string, unknown>[]): AdminCustomerRecord {
  return {
    id: row.id,
    authUserId: row.authUserId ?? null,
    email: row.userEmail ?? null,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    phone: row.phone ?? null,
    addresses: addresses.map(mapAddress),
    defaultAddressId: row.defaultAddressId ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    orderCount: row.orderCount,
    spent: row.spent,
  }
}

export function createAdminCustomersDomain() {
  return {
    async listCustomers(params?: AdminListParams): Promise<PaginatedResult<AdminCustomerRecord>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await adminFindAllCustomers({
        search: params?.search,
        sort: params?.sort,
        limit: perPage,
        offset,
      })

      const addresses = await findAddressesByCustomers(rows.map((row) => row.id))

      return {
        items: rows.map((row) => mapCustomer(row, addresses.filter((address) => address.customerId === row.id))),
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },

    async getCustomer(id: string): Promise<AdminCustomerRecord> {
      const row = await adminFindCustomerById(id)
      if (!row) throw new CommerceError(`Customer not found: ${id}`, "NOT_FOUND")
      return mapCustomer(row, await findAddresses(row.id))
    },

    async deleteCustomer(id: string): Promise<void> {
      const row = await adminFindCustomerById(id)
      if (!row) throw new CommerceError(`Customer not found: ${id}`, "NOT_FOUND")
      await adminDeleteCustomer(id)
    },
  }
}
