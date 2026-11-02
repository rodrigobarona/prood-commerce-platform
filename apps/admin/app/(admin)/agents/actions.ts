"use server"

import { revalidatePath } from "next/cache"
import { revokeAgent } from "@/lib/admin-queries"

export async function revokeAgentAction(id: string): Promise<void> {
  await revokeAgent(id)
  revalidatePath("/agents")
}
