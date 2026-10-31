// ---------------------------------------------------------------------------
// Customers domain — address book and profile fields (auth via Better Auth)
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Customer, Address, UpdateCustomerInput } from '@prood/types'
import {
  findCustomerById,
  updateCustomer as dbUpdateCustomer,
  findAddresses,
  findAddressById,
  createAddress as dbCreateAddress,
  updateAddress as dbUpdateAddress,
  deleteAddress as dbDeleteAddress,
} from '../database/index.js'

export function createCustomersDomain() {
  let currentCustomerId: string | null = null

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
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    }
  }

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

  function notSupported(method: string): never {
    throw new CommerceError(
      `${method} is handled by Better Auth — not the commerce adapter`,
      'NOT_SUPPORTED',
    )
  }

  return {
    login(_email: string, _password: string): Promise<Customer> {
      return notSupported('login')
    },

    register(): Promise<Customer> {
      return notSupported('register')
    },

    async getCustomer(): Promise<Customer> {
      if (!currentCustomerId) throw new CommerceError('Not authenticated', 'UNAUTHORIZED')
      const row = await findCustomerById(currentCustomerId)
      if (!row) throw new CommerceError('Customer not found', 'NOT_FOUND')
      return mapCustomer(row)
    },

    async updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
      if (!currentCustomerId) throw new CommerceError('Not authenticated', 'UNAUTHORIZED')

      const updates: Record<string, unknown> = {}
      if (input.firstName !== undefined) updates.firstName = input.firstName
      if (input.lastName !== undefined) updates.lastName = input.lastName
      if (input.phone !== undefined) updates.phone = input.phone

      await dbUpdateCustomer(currentCustomerId, updates)
      return this.getCustomer()
    },

    logout(): Promise<void> {
      currentCustomerId = null
      return Promise.resolve()
    },

    forgotPassword(): Promise<void> {
      return notSupported('forgotPassword')
    },

    resetPassword(): Promise<void> {
      return notSupported('resetPassword')
    },

    async getAddresses(): Promise<Address[]> {
      if (!currentCustomerId) throw new CommerceError('Not authenticated', 'UNAUTHORIZED')
      const rows = await findAddresses(currentCustomerId)
      return rows.map(mapAddress)
    },

    async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
      if (!currentCustomerId) throw new CommerceError('Not authenticated', 'UNAUTHORIZED')
      const id = crypto.randomUUID()

      await dbCreateAddress({
        id,
        customerId: currentCustomerId,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone ?? null,
        street: address.street,
        street2: address.street2 ?? null,
        city: address.city,
        state: address.state ?? null,
        country: address.country,
        postalCode: address.postalCode ?? null,
        isDefault: address.isDefault ?? false,
      })

      if (address.isDefault) {
        await dbUpdateCustomer(currentCustomerId, { defaultAddressId: id })
      }

      const row = await findAddressById(id)
      return mapAddress(row!)
    },

    async updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Promise<Address> {
      const updates: Record<string, unknown> = {}
      if (address.firstName != null) updates.firstName = address.firstName
      if (address.lastName != null) updates.lastName = address.lastName
      if (address.phone !== undefined) updates.phone = address.phone
      if (address.street != null) updates.street = address.street
      if (address.street2 !== undefined) updates.street2 = address.street2
      if (address.city != null) updates.city = address.city
      if (address.state !== undefined) updates.state = address.state
      if (address.country != null) updates.country = address.country
      if (address.postalCode !== undefined) updates.postalCode = address.postalCode
      if (address.isDefault != null) updates.isDefault = address.isDefault

      await dbUpdateAddress(addressId, updates)
      const row = await findAddressById(addressId)
      return mapAddress(row!)
    },

    async deleteAddress(addressId: string): Promise<void> {
      await dbDeleteAddress(addressId)
    },

    setCurrentCustomer(id: string | null) {
      currentCustomerId = id
    },
  }
}
