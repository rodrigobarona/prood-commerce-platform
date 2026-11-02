import { notFound } from "next/navigation"
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
import { planStatus } from "@prood/ui/lib/status"
import { BackLink, DetailLayout, PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { FOLD_CELL, ListTable, NoValue, RowLink } from "@prood/ui/components/list-table"
import { Timestamp } from "@/components/admin/timestamp"
import {
  getOrganizationById,
  getOrganizationDomains,
  getOrganizationMembers,
} from "@/lib/admin-queries"
import { formatNumber, humanize, plural } from "@/lib/format"
import { storedDomainStatus } from "@/lib/status"

const WIDE = "hidden @2xl:table-cell"
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "pr-5 @2xl:pr-2"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const org = await getOrganizationById(id)
  return { title: org?.name ?? "Organization" }
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [org, members, domains] = await Promise.all([
    getOrganizationById(id),
    getOrganizationMembers(id),
    getOrganizationDomains(id),
  ])

  if (!org) notFound()

  return (
    <AdminPage>
      <PageHeader
        back={<BackLink href="/organizations">All organizations</BackLink>}
        title={org.name}
        description={<span className="font-mono">{org.slug}</span>}
      />

      <DetailLayout
        aside={
          <Panel title="Details">
            <FactList>
              <Fact label="Plan">{humanize(org.planId)}</Fact>
              <Fact label="Status">
                <Status look={{ ...planStatus(org.planStatus), needsAction: false }} />
              </Fact>
              <Fact label="Members">
                <span className="tabular-nums">{formatNumber(members.length)}</span>
              </Fact>
              <Fact label="Custom domains">
                <span className="tabular-nums">{formatNumber(domains.length)}</span>
              </Fact>
              <Fact label="Created">
                <Timestamp date={org.createdAt} dateOnly />
              </Fact>
              <Fact label="ID">
                <CopyValue value={org.id} label="organization ID" />
              </Fact>
              {org.stripeCustomerId ? (
                <Fact label="Stripe customer">
                  <CopyValue value={org.stripeCustomerId} label="Stripe customer ID" />
                </Fact>
              ) : null}
              {org.stripeSubscriptionId ? (
                <Fact label="Stripe subscription">
                  <CopyValue value={org.stripeSubscriptionId} label="Stripe subscription ID" />
                </Fact>
              ) : null}
            </FactList>
          </Panel>
        }
        main={
          <>
        <Panel flush title={plural(members.length, "member")}>
          {members.length > 0 ? (
            <ListTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className={WIDE}>Email</TableHead>
                  <TableHead className={EDGE}>Role</TableHead>
                  <TableHead className={WIDE}>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.memberId}>
                    <TableCell className={FOLD_CELL}>
                      <RowLink href={`/users/${member.userId}`}>
                        {member.userName}
                      </RowLink>
                      <div className="truncate text-xs text-muted-foreground @2xl:hidden">
                        {member.userEmail}
                      </div>
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>
                      {member.userEmail}
                    </TableCell>
                    <TableCell className={EDGE}>{humanize(member.role)}</TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                      <Timestamp date={member.joinedAt} dateOnly />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ListTable>
          ) : (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              No members yet. People show up here once they accept an invitation
              to this store.
            </p>
          )}
        </Panel>

        <Panel flush title={plural(domains.length, "custom domain")}>
          {domains.length > 0 ? (
            <ListTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className={EDGE}>Verification</TableHead>
                  <TableHead className={WIDE}>Primary</TableHead>
                  <TableHead className={WIDE}>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <span className="font-mono text-xs break-all">{domain.domain}</span>
                      {domain.isPrimary ? (
                        <div className="text-xs text-muted-foreground @2xl:hidden">Primary</div>
                      ) : null}
                    </TableCell>
                    <TableCell className={EDGE}>
                      <Status look={storedDomainStatus(domain.verified)} />
                    </TableCell>
                    <TableCell className={WIDE}>
                      {domain.isPrimary ? "Primary" : <NoValue />}
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                      <Timestamp date={domain.createdAt} dateOnly />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ListTable>
          ) : (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              No custom domains. This store runs on its Prood address until the
              merchant adds one.
            </p>
          )}
        </Panel>
          </>
        }
      />
    </AdminPage>
  )
}
