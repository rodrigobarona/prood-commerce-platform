import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { CopyValue } from "@prood/ui/components/copy-block"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { BackLink, DetailLayout, PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { ListTable, NoValue, RowLink } from "@prood/ui/components/list-table"
import { Timestamp } from "@/components/admin/timestamp"
import {
  getUserById,
  getUserOrganizations,
  getUserSessions,
} from "@/lib/admin-queries"
import { assertAdmin } from "@/lib/auth"
import { describeUserAgent, humanize, plural, shortIp } from "@/lib/format"
import { emailStatus, userStatus } from "@/lib/status"
import { UserDangerZone, UserRoleForm, UserTwoFactorReset } from "./user-actions"

const WIDE = "hidden @2xl:table-cell"
/** The latest few on the page; the rest are a link away. */
const RECENT_SESSIONS = 5
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "pr-5 @2xl:pr-2"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUserById(id)
  return { title: user?.name ?? "User" }
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [admin, user, sessions, organizations] = await Promise.all([
    assertAdmin(),
    getUserById(id),
    getUserSessions(id),
    getUserOrganizations(id),
  ])

  if (!user) notFound()
  const self = user.id === admin.user.id

  const activeSessions = sessions.filter(
    (session) => session.expiresAt > new Date()
  )

  return (
    <AdminPage>
      <PageHeader
        back={<BackLink href="/users">All users</BackLink>}
        title={user.name}
        description={user.email}
      />

      <DetailLayout
        aside={
          <>
            <Panel title="Details">
              <FactList>
                <Fact label="Role">{humanize(user.role)}</Fact>
                <Fact label="Status">
                  <Status look={userStatus(user.banned)} />
                </Fact>
                {user.banned && user.banReason ? (
                  <Fact label="Ban reason">{user.banReason}</Fact>
                ) : null}
                <Fact label="Two-factor">{user.twoFactorEnabled ? "On" : "Off"}</Fact>
                <Fact label="Email">
                  <Status look={emailStatus(user.emailVerified)} />
                </Fact>
                <Fact label="Joined">
                  <Timestamp date={user.createdAt} dateOnly />
                </Fact>
                <Fact label="ID">
                  <CopyValue value={user.id} label="user ID" />
                </Fact>
              </FactList>
            </Panel>
            {self ? null : <UserRoleForm user={user} />}
            {self || !user.twoFactorEnabled ? null : <UserTwoFactorReset user={user} />}
          </>
        }
        main={
          <>
        <Panel flush title={plural(organizations.length, "organization")}>
          {organizations.length > 0 ? (
            <ListTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead className={WIDE}>Slug</TableHead>
                  <TableHead className={EDGE}>Role</TableHead>
                  <TableHead className={WIDE}>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.orgId}>
                    <TableCell>
                      <RowLink href={`/organizations/${org.orgId}`}>
                        {org.orgName}
                      </RowLink>
                      <div className="font-mono text-xs text-muted-foreground @2xl:hidden">{org.orgSlug}</div>
                    </TableCell>
                    <TableCell className={`${WIDE} font-mono text-xs text-muted-foreground`}>
                      {org.orgSlug}
                    </TableCell>
                    <TableCell className={EDGE}>{humanize(org.role)}</TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                      <Timestamp date={org.joinedAt} dateOnly />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ListTable>
          ) : (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              Not in any organization. Stores show up here once this person
              creates one or accepts an invitation.
            </p>
          )}
        </Panel>

        <Panel
          flush
          title={plural(activeSessions.length, "active session")}
          actions={
            activeSessions.length > RECENT_SESSIONS ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/sessions?user=${user.id}`}>View all sessions</Link>
              </Button>
            ) : undefined
          }
        >
          {activeSessions.length > 0 ? (
            <ListTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className={WIDE}>IP address</TableHead>
                  <TableHead className={WIDE}>Started</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.slice(0, RECENT_SESSIONS).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell title={session.userAgent ?? undefined}>
                      {describeUserAgent(session.userAgent) ?? <NoValue />}
                      {session.ipAddress ? (
                        <div className="font-mono text-xs text-muted-foreground @2xl:hidden">
                          {shortIp(session.ipAddress)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className={`${WIDE} font-mono text-xs`} title={session.ipAddress ?? undefined}>
                      {session.ipAddress ? shortIp(session.ipAddress) : <NoValue />}
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                      <Timestamp date={session.createdAt} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      <Timestamp date={session.expiresAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ListTable>
          ) : (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              Not signed in anywhere right now.
            </p>
          )}
        </Panel>
          </>
        }
      />

      {self ? null : <UserDangerZone user={user} />}
    </AdminPage>
  )
}
