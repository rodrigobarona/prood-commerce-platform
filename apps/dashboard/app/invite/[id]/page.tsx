import { Suspense } from "react"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { getAuth, getSession } from "@/lib/auth"
import { InvitationResponse } from "./invitation-response"

export const metadata = { title: "Store invitation" }

async function loadInvitation(id: string) {
  try {
    return await getAuth().api.getInvitation({ headers: await headers(), query: { id } })
  } catch (err) {
    // 4xx means expired, cancelled or for another email. Anything else is an
    // outage, which must not read as "ask for a new invitation".
    if (err instanceof APIError && err.statusCode < 500) return null
    throw err
  }
}

async function Invitation({ params }: { params: PageProps<"/invite/[id]">["params"] }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect(`/login?redirect=${encodeURIComponent(`/invite/${id}`)}`)

  const invitation = await loadInvitation(id)

  if (!invitation) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="This invitation isn't available"
          description={`It may have expired, been canceled, or been sent to a different email than ${session.user.email}. Ask the store owner to send a new one.`}
        />
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go to your dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Join ${invitation.organizationName}`}
        description={`${invitation.inviterEmail} invited you to help run this store as ${invitation.role}.`}
      />
      <InvitationResponse invitationId={invitation.id} />
    </div>
  )
}

export default function InvitePage({ params }: PageProps<"/invite/[id]">) {
  return (
    <AuthPage image="team-workshop" line="Run the store together, without sharing a password.">
      <Suspense fallback={<AuthFormSkeleton />}>
        <Invitation params={params} />
      </Suspense>
    </AuthPage>
  )
}
