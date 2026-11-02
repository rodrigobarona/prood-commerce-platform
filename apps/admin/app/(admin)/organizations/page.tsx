import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { FOLD_CELL, ListPagination, ListTable, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
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
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { Timestamp } from "@/components/admin/timestamp"
import { getOrgsByPlan, listOrganizations, type OrgSort } from "@/lib/admin-queries"
import { formatNumber, humanize } from "@/lib/format"

export const metadata = { title: "Organizations" }

const PATH = "/organizations"
const WIDE = "hidden @2xl:table-cell"
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "pr-5 @2xl:pr-2"
const PLANS = ["free", "grow", "scale", "agency"] as const
const SORTS: readonly OrgSort[] = ["createdAt", "name", "memberCount"]
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Name, A to Z", sort: "name", dir: "asc" },
  { label: "Name, Z to A", sort: "name", dir: "desc" },
  { label: "Most members", sort: "memberCount", dir: "desc" },
  { label: "Fewest members", sort: "memberCount", dir: "asc" },
]

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    tabParam: "plan",
    tabs: PLANS,
    sorts: SORTS,
    defaultSort: "createdAt",
    keep: ["billing"],
  })
  const pastDueOnly = list.params.billing === "past_due"

  const [{ rows: orgs, total }, byPlan] = await Promise.all([
    listOrganizations({
      q: list.q,
      limit: list.perPage,
      offset: list.offset,
      planId: list.tab,
      planStatus: pastDueOnly ? "past_due" : undefined,
      sort: list.sort ?? "createdAt",
      dir: list.dir,
    }),
    getOrgsByPlan(),
  ])
  if (orgs.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  const countFor = (planId: string) => byPlan.find((plan) => plan.planId === planId)?.count ?? 0
  const all = byPlan.reduce((sum, plan) => sum + plan.count, 0)

  return (
    <AdminPage>
      <PageHeader title="Organizations" description="Every store on Prood." />

      {all === 0 ? (
        <Panel flush>
          <PanelEmpty
            className="py-12"
            title="No organizations yet"
            description="Stores show up here as soon as a merchant creates one, with their plan and members."
          />
        </Panel>
      ) : (
        <Panel flush>
          <ListToolbar
            searchLabel="Search name or slug"
            tabParam="plan"
            tabsLabel="Filter organizations by plan"
            sorts={SORT_OPTIONS}
            currentSort={list}
            tabs={[
              { value: "", label: "All", count: all },
              ...PLANS.map((plan) => ({ value: plan, label: humanize(plan), count: countFor(plan) })),
            ]}
          />
          {pastDueOnly ? (
            <p className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-5 py-2 text-sm text-muted-foreground">
              Past due only. Plans are handled by hand for now, so contact the owner.
              <Link href={PATH} className="shrink-0 text-foreground underline underline-offset-4">
                Show all organizations
              </Link>
            </p>
          ) : null}
          {orgs.length > 0 ? (
            <>
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <SortableHead list={list} pathname={PATH} field="name">
                      Name
                    </SortableHead>
                    <TableHead className={WIDE}>Plan</TableHead>
                    <TableHead className={WIDE}>Status</TableHead>
                    <SortableHead list={list} pathname={PATH} field="memberCount" firstDirection="desc" align="right" className={EDGE}>
                      Members
                    </SortableHead>
                    <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                      Created
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id} className="relative">
                      <TableCell className={FOLD_CELL}>
                        <RowLink href={`/organizations/${org.id}`} stretch>
                          {org.name}
                        </RowLink>
                        <div className="truncate font-mono text-xs text-muted-foreground">{org.slug}</div>
                        <div className="truncate text-xs text-muted-foreground @2xl:hidden">{humanize(org.planId)}</div>
                      </TableCell>
                      <TableCell className={WIDE}>{humanize(org.planId)}</TableCell>
                      <TableCell className={WIDE}>
                        <Status look={planStatus(org.planStatus)} />
                      </TableCell>
                      <TableCell className={`${EDGE} text-right tabular-nums`}>{formatNumber(org.memberCount)}</TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                        <Timestamp date={org.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ListTable>
              <ListPagination list={list} pathname={PATH} total={total} noun="organization" />
            </>
          ) : (
            <PanelEmpty
              title="No organizations match"
              description="Nothing fits this search and plan."
              action={
                <Button asChild variant="outline">
                  <Link href={PATH}>Show all organizations</Link>
                </Button>
              }
            />
          )}
        </Panel>
      )}
    </AdminPage>
  )
}
