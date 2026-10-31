import { isStoreAdminRole } from "@prood/auth/membership"

/**
 * Coarse-grained capability a route requires of the caller.
 * - `storefront`: what a shopper can do
 * - `staff`: read the store's admin data
 * - `admin`: change the store. Implies `staff`.
 */
export type ApiScope = "storefront" | "staff" | "admin"

/** What a store member may do. Only owners and admins can change the store. */
export function scopesForRole(role: string): ApiScope[] {
  return isStoreAdminRole(role)
    ? ["admin", "staff", "storefront"]
    : ["staff", "storefront"]
}

export function hasScope(scopes: ApiScope[], required: ApiScope): boolean {
  return scopes.includes(required) || (required === "staff" && scopes.includes("admin"))
}

/** The grants an agent keeps: it can never do more than the user it acts for. */
export function capabilitiesForRole(capabilities: string[], role: string | null): string[] {
  return isStoreAdminRole(role)
    ? capabilities
    : capabilities.filter((capability) => !capability.startsWith("admin"))
}
