import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
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
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { FOLD_CELL, ListPagination, ListTable, NoValue, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { Timestamp } from "@/components/admin/timestamp"
import { getDomainCounts, listDomains, type DomainFilter } from "@/lib/admin-queries"
import { storedDomainStatus } from "@/lib/status"

export const metadata = { title: "Domains" }

const PATH = "/domains"
const WIDE = "hidden @2xl:table-cell"
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "pr-5 @2xl:pr-2"
const FILTERS: readonly DomainFilter[] = ["verified", "pending"]
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
]

export default async function DomainsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    tabs: FILTERS,
    sorts: ["createdAt"],
    defaultSort: "createdAt",
  })

  const [{ rows: domains, total }, counts] = await Promise.all([
    listDomains({
      q: list.q,
      limit: list.perPage,
      offset: list.offset,
      filter: list.tab,
      dir: list.dir,
    }),
    getDomainCounts(),
  ])
  if (domains.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  return (
    <AdminPage>
      <PageHeader
        title="Domains"
        description="Custom domains saved across every store. This shows what's stored, not whether a domain reaches its store."
      />

      {counts.all === 0 ? (
        <Panel flush>
          <PanelEmpty
            className="py-12"
            title="No custom domains yet"
            description="Domains show up here when a merchant adds one, so you can see which aren't verified yet."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/organizations">View organizations</Link>
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel flush>
          <ListToolbar
            searchLabel="Search domain or organization"
            tabsLabel="Filter domains by verification"
            sorts={SORT_OPTIONS}
            currentSort={list}
            tabs={[
              { value: "", label: "All", count: counts.all },
              { value: "verified", label: "Verified", count: counts.verified },
              { value: "pending", label: "Not verified", count: counts.pending },
            ]}
          />
          {domains.length > 0 ? (
            <>
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead className={WIDE}>Organization</TableHead>
                    <TableHead className={EDGE}>Verification</TableHead>
                    <TableHead className={WIDE}>Primary</TableHead>
                    <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                      Added
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className={FOLD_CELL}>
                        <span className="font-mono text-xs">{domain.domain}</span>
                        <div className="truncate text-xs text-muted-foreground @2xl:hidden">
                          <RowLink href={`/organizations/${domain.organizationId}`} className="font-normal">
                            {domain.orgName}
                          </RowLink>
                          {domain.verified && domain.isPrimary ? " · Primary" : null}
                        </div>
                      </TableCell>
                      <TableCell className={WIDE}>
                        <RowLink href={`/organizations/${domain.organizationId}`}>{domain.orgName}</RowLink>
                      </TableCell>
                      <TableCell className={EDGE}>
                        <Status look={storedDomainStatus(domain.verified)} />
                      </TableCell>
                      <TableCell className={WIDE}>{domain.verified && domain.isPrimary ? "Primary" : <NoValue />}</TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                        <Timestamp date={domain.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ListTable>
              <ListPagination list={list} pathname={PATH} total={total} noun="domain" />
            </>
          ) : (
            <PanelEmpty
              title="No domains match"
              description="Nothing fits this search and status."
              action={
                <Button asChild variant="outline">
                  <Link href={PATH}>Show all domains</Link>
                </Button>
              }
            />
          )}
        </Panel>
      )}
    </AdminPage>
  )
}
