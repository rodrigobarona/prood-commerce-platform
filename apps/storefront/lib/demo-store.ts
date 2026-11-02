import { DEMO_ORG_ID } from "@prood/platform"

/** The seeded demo: real checkout pages, nothing for sale. */
export function isDemoStore(tenantId: string): boolean {
  return tenantId === DEMO_ORG_ID
}
