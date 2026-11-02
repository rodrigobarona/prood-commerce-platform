import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ session: vi.fn(), demote: vi.fn() }))

vi.mock("@prood/auth/admin-role", () => ({ demoteAdmin: mocks.demote }))
vi.mock("better-auth/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("better-auth/api")>()),
  getSessionFromCtx: mocks.session,
}))

import { guardRoleChange } from "../auth/role-guard"

const change = (body: { userId?: string; role?: string | string[] }) =>
  guardRoleChange({ path: "/admin/set-role", body } as Parameters<typeof guardRoleChange>[0])

const update = (body: { userId?: string; data?: Record<string, unknown> }) =>
  guardRoleChange({ path: "/admin/update-user", body } as Parameters<typeof guardRoleChange>[0])

describe("guardRoleChange", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({ user: { id: "admin-1", role: "admin" } })
    mocks.demote.mockResolvedValue(true)
  })

  it("refuses an admin's own account, whichever role", async () => {
    await expect(change({ userId: "admin-1", role: "admin" })).rejects.toThrow("their own role")
    await expect(change({ userId: "admin-1", role: "user" })).rejects.toThrow("their own role")
    expect(mocks.demote).not.toHaveBeenCalled()
  })

  it("demotes through the one guarded statement", async () => {
    await expect(change({ userId: "admin-2", role: "user" })).resolves.toBeUndefined()
    expect(mocks.demote).toHaveBeenCalledWith("admin-2")
  })

  it("refuses when it would leave nobody who can sign in", async () => {
    mocks.demote.mockResolvedValue(false)
    await expect(change({ userId: "admin-2", role: "user" })).rejects.toThrow("at least one admin")
  })

  it("leaves a promotion alone", async () => {
    await change({ userId: "user-1", role: ["admin"] })
    expect(mocks.demote).not.toHaveBeenCalled()
  })

  it("leaves callers who aren't admins for the plugin to refuse", async () => {
    mocks.session.mockResolvedValue({ user: { id: "user-1", role: "user" } })
    await expect(change({ userId: "admin-2", role: "user" })).resolves.toBeUndefined()
    expect(mocks.demote).not.toHaveBeenCalled()
  })

  it.each([["bogus"], [7], [[]], [undefined], [["user", "bogus"]]])("refuses %j before demoting anyone", async (role) => {
    await expect(change({ userId: "admin-2", role: role as string })).rejects.toThrow("isn't a role")
    expect(mocks.demote).not.toHaveBeenCalled()
  })

  describe("on /admin/update-user", () => {
    it("refuses any role, from anyone", async () => {
      await expect(update({ userId: "admin-2", data: { role: "user" } })).rejects.toThrow("Use set-role")
      await expect(update({ userId: "admin-2", data: { role: 7 } })).rejects.toThrow("Use set-role")

      mocks.session.mockResolvedValue({ user: { id: "user-1", role: "user" } })
      await expect(update({ userId: "admin-2", data: { role: "admin" } })).rejects.toThrow("Use set-role")
      expect(mocks.demote).not.toHaveBeenCalled()
    })

    it("leaves an update that doesn't touch the role alone", async () => {
      await expect(update({ userId: "admin-1", data: { name: "Ana" } })).resolves.toBeUndefined()
      expect(mocks.session).not.toHaveBeenCalled()
    })
  })

  it("ignores every other route", async () => {
    await guardRoleChange({ path: "/admin/list-users", body: {} } as Parameters<typeof guardRoleChange>[0])
    expect(mocks.session).not.toHaveBeenCalled()
  })
})
