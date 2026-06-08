"use server"

import { revalidatePath } from "next/cache"
import { deactivateAgent } from "@/lib/admin-queries"

export async function deactivateAgentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await deactivateAgent(id)
  revalidatePath("/agents")
}
