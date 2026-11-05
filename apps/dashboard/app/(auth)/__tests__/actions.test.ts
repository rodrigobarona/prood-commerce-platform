import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ rows: [] as { id: string }[], select: vi.fn() }))

vi.mock("@/lib/auth/db", () => ({
  authDb: {
    select: (...args: unknown[]) => {
      mocks.select(...args)
      return { from: () => ({ where: () => ({ limit: async () => mocks.rows }) }) }
    },
  },
}))
vi.mock("@/lib/auth/schema", () => ({ organization: { id: "id", slug: "slug" } }))

import { checkStoreAddressAction } from "../actions"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.rows = []
})

describe("checkStoreAddressAction", () => {
  it("says whether an address is free", async () => {
    await expect(checkStoreAddressAction("casa-lume")).resolves.toBe("available")
    mocks.rows = [{ id: "org-1" }]
    await expect(checkStoreAddressAction("casa-lume")).resolves.toBe("taken")
  })

  it("keeps Prood's own addresses", async () => {
    await expect(checkStoreAddressAction("admin")).resolves.toBe("reserved")
    expect(mocks.select).not.toHaveBeenCalled()
  })

  it("asks the database nothing the address field couldn't have typed", async () => {
    for (const input of ["Casa Lume", "casa--lume", "-casa", "a".repeat(49), 42]) {
      await expect(checkStoreAddressAction(input as string)).rejects.toThrow()
    }
    expect(mocks.select).not.toHaveBeenCalled()
  })
})
