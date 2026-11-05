import { MAX_STORE_SLUG_LENGTH, RESERVED_STORE_SLUGS, requiredEnv, slugify, storeOriginForSlug } from "@prood/types"
import { authClient } from "@/lib/auth/client"

const storefrontUrl = requiredEnv(process.env.NEXT_PUBLIC_STOREFRONT_URL, "NEXT_PUBLIC_STOREFRONT_URL")

/** What follows the address in a store's URL: `.prood.app`. */
export const STORE_HOST_SUFFIX = `.${new URL(storefrontUrl).host}`

export function addressFromName(name: string): string {
  return cleanAddress(slugify(name)).replace(/-+$/, "")
}

/** Keeps a typed address valid without fighting the keyboard: a hyphen can still end it for now. */
export function cleanAddress(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_STORE_SLUG_LENGTH)
}

export function storeHost(slug: string): string {
  return new URL(storeOriginForSlug(storefrontUrl, slug)).host
}

function withSuffix(address: string): string {
  return `${address}-${Math.random().toString(36).slice(2, 7)}`
}

/** The address as it'll be saved: only `a-z`, digits and inner hyphens. */
function finalAddress(address: string): string {
  return cleanAddress(address).replace(/-+$/, "") || "store"
}

/** The address asked for, with a suffix only if a store has it already or it's reserved. */
async function availableSlug(address: string): Promise<string> {
  if (RESERVED_STORE_SLUGS.has(address)) return withSuffix(address)
  const { error } = await authClient.organization.checkSlug({ slug: address })
  return error ? withSuffix(address) : address
}

const SLUG_TAKEN = "ORGANIZATION_ALREADY_EXISTS"

export type CreateStoreResult = { error: string } | { host: string }

/** Create a store (organization) and make it active. */
export async function createStore(name: string, address: string): Promise<CreateStoreResult> {
  const failed = { error: "We couldn't create your store. Check the name and try again." }
  try {
    const wanted = finalAddress(address)
    let slug = await availableSlug(wanted)
    let result = await authClient.organization.create({ name, slug })
    // Someone took the address between the check and now.
    if (result.error?.code === SLUG_TAKEN) {
      slug = withSuffix(wanted)
      result = await authClient.organization.create({ name, slug })
    }
    const { data: org, error } = result
    if (error || !org) return error?.message ? { error: error.message } : failed

    // The store exists now, so a failed activation must not invite a retry
    // that creates a second one. It's still in the store switcher.
    const { error: activeError } = await authClient.organization.setActive({
      organizationId: org.id,
    })
    if (activeError) console.error("[create-store] could not activate store", activeError)
    return { host: storeHost(slug) }
  } catch {
    return failed
  }
}
