// Dashboard auth schema — re-exports shared Better Auth tables and adds
// dashboard-only tables (tenant domains, integration configs).
export {
  account,
  apikey,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "@prood/auth/schema"

import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { organization } from "@prood/auth/schema"

export const tenantDomain = pgTable("tenant_domain", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  verified: boolean("verified").notNull().default(false),
  isPrimary: boolean("is_primary").notNull().default(false),
  dnsRecords: jsonb("dns_records")
    .$type<{ type: string; host: string; value: string }[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const integrationConfig = pgTable(
  "integration_config",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    config: jsonb("config")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("integration_config_org_provider_idx").on(
      table.organizationId,
      table.provider
    ),
  ]
)
