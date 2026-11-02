"use server"

import { RESERVED_STORE_SLUGS } from "@prood/types"
import { eq } from "drizzle-orm"
import { authDb } from "@/lib/auth/db"
import { organization } from "@/lib/auth/schema"

export type AddressAvailability = "available" | "taken" | "reserved"

/** Runs before there's a session, as someone types at sign-up. It only says what a public URL would. */
export async function checkStoreAddressAction(address: string): Promise<AddressAvailability> {
  if (RESERVED_STORE_SLUGS.has(address)) return "reserved"
  const [taken] = await authDb
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, address))
    .limit(1)
  return taken ? "taken" : "available"
}
