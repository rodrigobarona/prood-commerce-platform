"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { recordAdminAction } from "@prood/auth/admin-audit"
import { revokeAgent } from "@/lib/admin-queries"
import { assertAdmin } from "@/lib/auth"

export async function revokeAgentAction(id: string): Promise<void> {
  const admin = await assertAdmin()
  await revokeAgent(id)
  const requestHeaders = await headers()
  await recordAdminAction({
    actorId: admin.user.id,
    action: "agent.revoke",
    targetType: "agent",
    targetId: id,
    ipAddress: requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  })
  revalidatePath("/agents")
}
