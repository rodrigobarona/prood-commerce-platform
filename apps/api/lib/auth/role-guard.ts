import { demoteAdmin } from "@prood/auth/admin-role"
import { APIError, getSessionFromCtx } from "better-auth/api"

const KNOWN_ROLES: unknown[] = ["user", "admin"]

type RoleRoute = Parameters<typeof getSessionFromCtx>[0] & {
  path: string
  body?: { userId?: string; role?: unknown; data?: { role?: unknown } }
}

/** The plugin checks this too, but only after this guard has demoted anyone. */
function isKnownRole(role: unknown): role is string | string[] {
  const roles = [role].flat()
  return roles.length > 0 && roles.every((value) => KNOWN_ROLES.includes(value))
}

/**
 * `/admin/set-role` and `/admin/update-user` are reachable through every
 * /api/auth proxy, so their rules live here and not only in the admin console.
 * Roles change on set-role and nowhere else. Callers who aren't admins fall
 * through: the plugin refuses them.
 */
export async function guardRoleChange(ctx: RoleRoute): Promise<void> {
  const { path, body } = ctx
  if (path === "/admin/update-user" && Object.hasOwn(body?.data ?? {}, "role")) {
    throw new APIError("FORBIDDEN", { message: "Roles can't change here. Use set-role." })
  }
  if (path !== "/admin/set-role") return

  const session = await getSessionFromCtx(ctx)
  if (session?.user.role !== "admin") return
  const { userId, role } = body ?? {}
  if (userId === session.user.id) {
    throw new APIError("FORBIDDEN", { message: "Admins can't change their own role." })
  }
  if (!isKnownRole(role)) {
    throw new APIError("BAD_REQUEST", { message: "That isn't a role. Use user or admin." })
  }
  if (userId && ![role].flat().includes("admin") && !(await demoteAdmin(userId))) {
    throw new APIError("FORBIDDEN", { message: "Prood needs at least one admin who can sign in." })
  }
}
