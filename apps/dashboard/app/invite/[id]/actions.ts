"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth"

export async function acceptInvitationAction(invitationId: string): Promise<{ error: string }> {
  const requestHeaders = await headers()
  let organizationId: string | undefined
  try {
    const result = await getAuth().api.acceptInvitation({
      headers: requestHeaders,
      body: { invitationId },
    })
    organizationId = result?.invitation.organizationId
  } catch (err) {
    return { error: err instanceof Error ? err.message : "We couldn't accept this invitation." }
  }

  if (organizationId) {
    // The invitation is already accepted. If activation fails, the store is
    // still in the user's store switcher.
    await getAuth()
      .api.setActiveOrganization({ headers: requestHeaders, body: { organizationId } })
      .catch((err) => console.error("[invite] could not activate store", err))
  }
  redirect("/")
}

export async function declineInvitationAction(invitationId: string): Promise<{ error: string }> {
  try {
    await getAuth().api.rejectInvitation({
      headers: await headers(),
      body: { invitationId },
    })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "We couldn't decline this invitation." }
  }
  redirect("/")
}
