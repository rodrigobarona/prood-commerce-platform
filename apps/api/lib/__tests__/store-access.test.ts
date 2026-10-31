import { describe, expect, it } from "vitest"
import { storeAccess } from "@prood/auth/access"
import { isStoreAdminRole } from "@prood/auth/membership"

const canCreateApiKeys = (role: keyof typeof storeAccess.roles) =>
  storeAccess.roles[role].authorize({ apiKey: ["create"] }).success

describe("store roles", () => {
  it("lets owners and admins create API keys, and no one else", () => {
    expect(canCreateApiKeys("owner")).toBe(true)
    expect(canCreateApiKeys("admin")).toBe(true)
    expect(canCreateApiKeys("member")).toBe(false)
  })

  it("only treats owners and admins as store admins", () => {
    expect(isStoreAdminRole("owner")).toBe(true)
    expect(isStoreAdminRole("admin")).toBe(true)
    expect(isStoreAdminRole("member,admin")).toBe(true)
    expect(isStoreAdminRole("member")).toBe(false)
    expect(isStoreAdminRole("administrator")).toBe(false)
    expect(isStoreAdminRole(null)).toBe(false)
  })
})
