"use server"

import { revalidatePath } from "next/cache"
import { deactivateAgent } from "@/lib/admin-queries"

export async function deactivateAgentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "")
  if (!id) return
  try {
    await deactivateAgent(id)
    revalidatePath("/agents")
  } catch (error) {
    console.error("[deactivateAgentAction] deactivateAgent failed:", error)
    throw new Error("Could not deactivate agent. Please try again.")
  }
}
