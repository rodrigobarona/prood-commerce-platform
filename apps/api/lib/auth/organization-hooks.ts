import { provisionOrganizationStore } from "@prood/commerce/tenant-store"

/** Commerce bootstrap when a Better Auth organization (merchant store) is created. */
export const organizationHooks = {
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
