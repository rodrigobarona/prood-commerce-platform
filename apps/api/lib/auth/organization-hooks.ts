import { provisionOrganizationStore } from "@prood/commerce/tenant-store"
import { countTeamSeats } from "@prood/auth/membership"
import { RESERVED_STORE_SLUGS } from "@prood/types"
import { APIError } from "better-auth/api"
import { getOrganizationLimits } from "@/lib/org-plan"

/** Better Auth stops membership here whatever the plan, so "unlimited" means this. */
const MAX_MEMBERS = 100
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_SLUG = 63

/** The browser picks a store's address, so everything about it is checked again here. */
export function assertStoreSlug(slug: string | undefined): void {
  if (slug && slug.length <= MAX_SLUG && SLUG.test(slug) && !RESERVED_STORE_SLUGS.has(slug)) return
  throw new APIError("BAD_REQUEST", {
    message: "We can't use that store address. Use lowercase letters, numbers and hyphens, and pick a different one.",
  })
}

/** The dashboard checks this too, but only the API can stop a call that skips it. */
export async function assertSeatAvailable(organizationId: string): Promise<void> {
  const { maxTeamSeats } = await getOrganizationLimits(organizationId)
  if (maxTeamSeats === null || (await countTeamSeats(organizationId)) < maxTeamSeats) return
  throw new APIError("FORBIDDEN", {
    message:
      maxTeamSeats <= 1
        ? "Team invites start on Grow. Paid plans can't be bought yet."
        : "Every team seat on your plan is taken. Paid plans can't be bought yet.",
  })
}

export async function membershipLimit(_user: unknown, organization: { id: string }): Promise<number> {
  return (await getOrganizationLimits(organization.id)).maxTeamSeats ?? MAX_MEMBERS
}

/** Commerce bootstrap when a Better Auth organization (merchant store) is created. */
export const organizationHooks = {
  beforeCreateOrganization: async ({ organization }: { organization: { slug?: string } }) => {
    assertStoreSlug(organization.slug)
  },
  // Links, emails and custom domains all hang off the address, so it stays what it was.
  beforeUpdateOrganization: async ({ organization }: { organization: { slug?: string } }) => {
    if (organization.slug === undefined) return
    throw new APIError("BAD_REQUEST", { message: "We can't change a store's address once it's created." })
  },
  beforeCreateInvitation: async ({ organization }: { organization: { id: string } }) => {
    await assertSeatAvailable(organization.id)
  },
  afterCreateOrganization: async ({
    organization,
  }: {
    organization: { id: string; name: string }
  }) => {
    await provisionOrganizationStore(organization.id, {
      name: organization.name,
    })
  },
}
