"use server"

import { MAX_STORE_SLUG_LENGTH, RESERVED_STORE_SLUGS, STORE_SLUG_PATTERN } from "@prood/types"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { authDb } from "@/lib/auth/db"
import { organization } from "@/lib/auth/schema"

export type AddressAvailability = "available" | "taken" | "reserved"

const storeAddress = z.string().max(MAX_STORE_SLUG_LENGTH).regex(STORE_SLUG_PATTERN)

/** Runs before there's a session, as someone types at sign-up. It only says what a public URL would. */
export async function checkStoreAddressAction(input: string): Promise<AddressAvailability> {
  // Anyone can call this, so it reads nothing the field couldn't have typed.
  const address = storeAddress.parse(input)
  if (RESERVED_STORE_SLUGS.has(address)) return "reserved"
  const [taken] = await authDb
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, address))
    .limit(1)
  return taken ? "taken" : "available"
}
