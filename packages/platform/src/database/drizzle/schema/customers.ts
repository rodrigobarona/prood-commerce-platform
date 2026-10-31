// ---------------------------------------------------------------------------
// Customers schema — tenant-scoped commerce profiles (no credentials / email)
// ---------------------------------------------------------------------------
// Auth lives in Better Auth `user`. Link via auth_user_id only on this table.
// Commerce references buyers by customers.id (internal UUID) everywhere else.
// ---------------------------------------------------------------------------

import { boolean, pgTable, text, timestamp, index, unique } from 'drizzle-orm/pg-core'
import { organizationId, tenantIsolation } from './tenant.js'

export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  authUserId: text('auth_user_id'),
  email: text('email'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  defaultAddressId: text('default_address_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.organizationId, t.authUserId),
  tenantIsolation(),
])

export const customerAddresses = pgTable('customer_addresses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: organizationId(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  street: text('street').notNull(),
  street2: text('street2'),
  city: text('city').notNull(),
  state: text('state'),
  country: text('country').notNull(),
  postalCode: text('postal_code'),
  isDefault: boolean('is_default').notNull().default(false),
}, (t) => [
  index().on(t.organizationId),
  tenantIsolation(),
])
