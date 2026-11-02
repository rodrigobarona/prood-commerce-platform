import { Suspense } from "react"
import { UsersThree } from "@phosphor-icons/react/dist/ssr"
import { getEntitlements } from "@prood/billing"
import { ListTable } from "@prood/ui/components/list-table"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { StatusBadge } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { TablePanelSkeleton } from "@/components/skeletons"
import { InviteMemberForm } from "@/components/team/invite-member-form"
import {
  CancelInvitationButton,
  RemoveMemberButton,
} from "@/components/team/team-actions"
import { getCurrentUser, getFullActiveOrganization } from "@/lib/auth"
import { getActiveOrganizationPlan, seatLimitMessage } from "@/lib/billing"
import { humanize } from "@/lib/format"

export const metadata = { title: "Team" }

const WIDE = "hidden @2xl:table-cell"

export default function TeamPage() {
  return (
    <DashboardPage>
      <PageHeader title="Team" description="Who can work on this store. Everyone signs in with their own account." />

      <Suspense fallback={<TablePanelSkeleton rows={3} />}>
        <TeamContent />
      </Suspense>
    </DashboardPage>
  )
}

async function TeamContent() {
  let org: Awaited<ReturnType<typeof getFullActiveOrganization>> = null
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>> = null
  let plan: Awaited<ReturnType<typeof getActiveOrganizationPlan>> = null
  try {
    ;[org, currentUser, plan] = await Promise.all([
      getFullActiveOrganization(),
      getCurrentUser(),
      getActiveOrganizationPlan(),
    ])
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
  }

  const members = org?.members ?? []
  const invitations = (org?.invitations ?? []).filter(
    (invite) => invite.status === "pending"
  )
  const seats = getEntitlements(plan?.planId ?? "free").maxTeamSeats
  const atLimit = seats !== null && members.length + invitations.length >= seats
  const invitesOn = seats === null || seats > 1

  const invite = (
    <Panel title="Invite a teammate" description={atLimit ? undefined : "They'll get an email, and access to this store's dashboard once they accept."}>
      {atLimit ? (
        <p className="text-sm text-pretty text-muted-foreground">{seatLimitMessage(seats)}</p>
      ) : (
        <InviteMemberForm />
      )}
    </Panel>
  )

  return (
    <>
      {invitesOn ? invite : null}

      <Panel title="Members" flush>
        {members.length > 0 ? (
          <ListTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className={WIDE}>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.userId === currentUser?.id
                const isOwner = member.role === "owner"
                const name = member.user?.name ?? member.user?.email ?? "this member"
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user?.name ?? "—"}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">You</span>
                      ) : null}
                      <div className="max-w-52 truncate text-xs font-normal text-muted-foreground @2xl:hidden">
                        {member.user?.email}
                      </div>
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>
                      {member.user?.email ?? "—"}
                    </TableCell>
                    <TableCell>{humanize(member.role)}</TableCell>
                    <TableCell className="w-px text-right">
                      {isSelf || isOwner ? null : <RemoveMemberButton memberId={member.id} name={name} />}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </ListTable>
        ) : (
          <PanelEmpty
            icon={<UsersThree />}
            title="No members yet"
            description="People you invite show up here once they accept. Use the form above to invite the first."
          />
        )}
      </Panel>

      {invitations.length > 0 ? (
        <Panel title="Pending invitations" flush>
          <ListTable>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className={WIDE}>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell>{humanize(invite.role ?? "member")}</TableCell>
                  <TableCell className={WIDE}>
                    <StatusBadge tone="warning">Waiting to accept</StatusBadge>
                  </TableCell>
                  <TableCell className="w-px text-right">
                    <CancelInvitationButton invitationId={invite.id} email={invite.email} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ListTable>
        </Panel>
      ) : null}

      {/* On a plan with one seat there's nothing to do here, so the people come first. */}
      {invitesOn ? null : invite}
    </>
  )
}
