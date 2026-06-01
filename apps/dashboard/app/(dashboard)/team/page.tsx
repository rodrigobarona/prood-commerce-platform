import { UsersThree } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@prood/ui/components/badge"
import { DashboardEmpty } from "@/components/dashboard-empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { InviteMemberForm } from "@/components/team/invite-member-form"
import {
  CancelInvitationButton,
  RemoveMemberButton,
} from "@/components/team/team-actions"
import { getCurrentUser, getFullActiveOrganization } from "@/lib/auth"

export const metadata = { title: "Team" }

export default async function TeamPage() {
  const [org, currentUser] = await Promise.all([
    getFullActiveOrganization(),
    getCurrentUser(),
  ])

  const members = org?.members ?? []
  const invitations = (org?.invitations ?? []).filter(
    (invite) => invite.status === "pending"
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Team</h2>
        <p className="text-sm text-muted-foreground">
          Invite teammates to this store and manage their roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite a teammate</CardTitle>
          <CardDescription>
            They&apos;ll get access to this store&apos;s dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.userId === currentUser?.id
                  const isOwner = member.role === "owner"
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="pl-5 font-medium">
                        {member.user?.name ?? "—"}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.user?.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        {isSelf || isOwner ? null : (
                          <RemoveMemberButton memberId={member.id} />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <DashboardEmpty
              className="border-0 py-10"
              icon={UsersThree}
              title="No members yet"
              description="Invite teammates using the form above."
            />
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="pl-5 font-medium">
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.role ?? "member"}</Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <CancelInvitationButton invitationId={invite.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
