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

/** Why a caller was refused, and what to do about it. `staff` isn't a scope keys come in. */
export function scopeRefusal(scope: ApiScope, via: "api-key" | "session" | "host" | "agent"): string {
  if (via === "session") return "Only store owners and admins can do this."
  if (via === "agent") {
    return "This AI agent wasn't given access to this. Ask the store owner to approve a new request that includes it."
  }
  if (via === "host") return "This needs an API key or a store member's session."
  const needed = scope === "storefront" ? "storefront" : "admin"
  const plan = needed === "admin" ? " Admin keys start on Grow." : ""
  return `This API key doesn't have the ${needed} scope. Create a key with it in your dashboard, under API keys.${plan}`
}

/** The grants an agent keeps: it can never do more than the user it acts for. */
export function capabilitiesForRole(capabilities: string[], role: string | null): string[] {
  return isStoreAdminRole(role)
    ? capabilities
    : capabilities.filter((capability) => !capability.startsWith("admin"))
}
