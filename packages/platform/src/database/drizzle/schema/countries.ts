// ---------------------------------------------------------------------------
// Countries schema
// ---------------------------------------------------------------------------

import { pgTable, text, boolean, jsonb } from 'drizzle-orm/pg-core'
import type { LocalizedField } from '@prood/types'

export const countries = pgTable('countries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  name: jsonb('name').$type<LocalizedField>().notNull().default({}),
  callingCode: text('calling_code'),
  currency: text('currency'),
  capital: text('capital'),
  isActive: boolean('is_active').notNull().default(true),
})
