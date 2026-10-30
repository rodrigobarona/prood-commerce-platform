import { authClient } from "@/lib/auth/client"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

/** Create a store (organization) and make it active. Returns an error message on failure. */
export async function createStore(name: string): Promise<string | null> {
  const slug = `${slugify(name) || "store"}-${Math.random().toString(36).slice(2, 7)}`
  try {
    const { data: org, error } = await authClient.organization.create({ name, slug })
    if (error || !org) return error?.message ?? "Could not create your store"

    // The store exists now, so a failed activation must not invite a retry
    // that creates a second one. It's still in the store switcher.
    const { error: activeError } = await authClient.organization.setActive({
      organizationId: org.id,
    })
    if (activeError) console.error("[create-store] could not activate store", activeError)
    return null
  } catch {
    return "Could not create your store"
  }
}
