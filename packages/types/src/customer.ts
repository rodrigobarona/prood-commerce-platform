// ---------------------------------------------------------------------------
// Customer domain types
// ---------------------------------------------------------------------------

import type { Id, Maybe, DeepPartial } from './common.js'

/** Physical address */
export interface Address {
  id: Id
  firstName: string
  lastName: string
  phone: Maybe<string>
  street: string
  /** Additional street line (apartment, floor, etc.) */
  street2: Maybe<string>
  city: string
  state: Maybe<string>
  country: string
  postalCode: Maybe<string>
  isDefault: boolean
}

/**
 * Address snapshot on a cart or order: what the shopper entered at checkout,
 * stored as given. Not an address-book row, so it has no id or default flag,
 * and optional lines the shopper skipped are absent.
 */
export interface CheckoutAddress {
  firstName: string
  lastName: string
  phone?: Maybe<string>
  street: string
  street2?: Maybe<string>
  city: string
  state?: Maybe<string>
  country: string
  postalCode?: Maybe<string>
}

/** Customer entity — email joined from Better Auth at read boundaries when needed */
export interface Customer {
  id: Id
  email: Maybe<string>
  firstName: Maybe<string>
  lastName: Maybe<string>
  phone: Maybe<string>
  addresses: Address[]
  defaultAddressId: Maybe<Id>
  createdAt: string
  updatedAt: string
}

/** Input for customer registration */
export interface RegisterInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

/**
 * Input for updating customer profile.
 * Uses DeepPartial to allow nested partial updates (e.g., updating a single address field).
 */
export type UpdateCustomerInput = DeepPartial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>
