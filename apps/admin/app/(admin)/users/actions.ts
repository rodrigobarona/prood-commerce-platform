"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { demoteAdmin } from "@prood/auth/admin-role"
import { recordAdminAction, type AdminAuditInput } from "@prood/auth/admin-audit"
import { getSessionToken } from "@/lib/admin-queries"
import { assertAdmin, getAuth } from "@/lib/auth"

/** An admin can't lock themselves out from their own user page, even by calling the action directly. */
async function assertNotSelf(userId: string) {
  const admin = await assertAdmin()
  if (admin.user.id === userId) {
    throw new Error("Admins can't ban, demote or sign out their own account.")
  }
  return admin
}

/** Records what the signed-in administrator just did. */
async function audit(adminId: string, entry: Omit<AdminAuditInput, "actorId" | "ipAddress">) {
  const requestHeaders = await headers()
  await recordAdminAction({
    actorId: adminId,
    ipAddress: requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    ...entry,
  })
}

export async function banUser(userId: string, reason?: string) {
  const admin = await assertNotSelf(userId)
  await getAuth().api.banUser({
    headers: await headers(),
    body: {
      userId,
      ...(reason ? { banReason: reason } : {}),
    },
  })
  await audit(admin.user.id, { action: "user.ban", targetType: "user", targetId: userId, metadata: reason ? { reason } : null })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function unbanUser(userId: string) {
  const admin = await assertAdmin()
  await getAuth().api.unbanUser({
    headers: await headers(),
    body: { userId },
  })
  await audit(admin.user.id, { action: "user.unban", targetType: "user", targetId: userId })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  const admin = await assertNotSelf(userId)
  if (role !== "user" && role !== "admin") throw new Error("That isn't a role.")
  if (role === "user" && !(await demoteAdmin(userId))) {
    throw new Error("Prood needs at least one admin who can sign in.")
  }
  await getAuth().api.setRole({
    headers: await headers(),
    body: { userId, role },
  })
  await audit(admin.user.id, { action: "user.set_role", targetType: "user", targetId: userId, metadata: { role } })
  revalidatePath("/users")
  revalidatePath(`/users/${userId}`)
}

export async function revokeAllUserSessions(userId: string) {
  const admin = await assertNotSelf(userId)
  await getAuth().api.revokeUserSessions({
    headers: await headers(),
    body: { userId },
  })
  await audit(admin.user.id, { action: "user.revoke_sessions", targetType: "user", targetId: userId })
  revalidatePath("/sessions")
  revalidatePath(`/users/${userId}`)
}

/** Signs one device out. The token never reaches the page, so this looks it up by id. */
export async function revokeSession(sessionId: string, userId: string) {
  const admin = await assertAdmin()
  const sessionToken = await getSessionToken(sessionId)
  if (!sessionToken) return
  await getAuth().api.revokeUserSession({
    headers: await headers(),
    body: { sessionToken },
  })
  await audit(admin.user.id, { action: "session.revoke", targetType: "user", targetId: userId, metadata: { sessionId } })
  revalidatePath("/sessions")
  revalidatePath(`/users/${userId}`)
}
