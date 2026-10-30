import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Button } from "@prood/ui/components/button"
import { getAuth, getSession } from "@/lib/auth"
import { InvitationResponse } from "./invitation-response"

export const metadata = { title: "Store invitation" }

async function loadInvitation(id: string) {
  try {
    return await getAuth().api.getInvitation({ headers: await headers(), query: { id } })
  } catch {
    return null
  }
}

export default async function InvitePage({ params }: PageProps<"/invite/[id]">) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect(`/login?redirect=${encodeURIComponent(`/invite/${id}`)}`)

  const invitation = await loadInvitation(id)

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        {invitation ? (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Join {invitation.organizationName}</CardTitle>
              <CardDescription>
                {invitation.inviterEmail} invited you to help run this store as {invitation.role}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationResponse invitationId={invitation.id} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-xl">This invitation isn&apos;t available</CardTitle>
              <CardDescription>
                It may have expired, been cancelled, or been sent to a different email than{" "}
                {session.user.email}. Ask the store owner to send a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Go to your dashboard</Link>
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  )
}
