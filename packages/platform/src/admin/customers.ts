// ---------------------------------------------------------------------------
// Admin: Customer management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Customer, Address, PaginatedResult } from '@prood/types'
import type { AdminListParams } from './types.js'
import {
  adminFindAllCustomers,
  adminFindCustomerById,
  adminDeleteCustomer,
  findAddresses,
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

async function mapCustomer(row: {
  id: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  defaultAddressId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  userEmail?: string | null
}): Promise<Customer> {
  const addresses = await findAddresses(row.id)
  return {
    id: row.id,
    email: row.userEmail ?? null,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    phone: row.phone ?? null,
    addresses: addresses.map(mapAddress),
    defaultAddressId: row.defaultAddressId ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

export function createAdminCustomersDomain() {
  return {
    async listCustomers(params?: AdminListParams): Promise<PaginatedResult<Customer>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await adminFindAllCustomers({
        search: params?.search,
        limit: perPage,
        offset,
      })

      const customers = await Promise.all(rows.map(mapCustomer))

      return {
        items: customers,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },

    async getCustomer(id: string): Promise<Customer> {
      const row = await adminFindCustomerById(id)
      if (!row) throw new CommerceError(`Customer not found: ${id}`, "NOT_FOUND")
      return mapCustomer(row)
    },

    async deleteCustomer(id: string): Promise<void> {
      const row = await adminFindCustomerById(id)
      if (!row) throw new CommerceError(`Customer not found: ${id}`, "NOT_FOUND")
      await adminDeleteCustomer(id)
    },
  }
}
