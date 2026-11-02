import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { FOLD_CELL_4XL, ListPagination, ListTable, NoValue, RowLink, SortableHead } from "@prood/ui/components/list-table"
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
import { apiKeyStatus } from "@prood/ui/lib/status"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { Timestamp } from "@/components/admin/timestamp"
import { getApiKeyCounts, listApiKeys, type ApiKeyFilter, type ApiKeySort } from "@/lib/admin-queries"
import { formatNumber, plural } from "@/lib/format"

export const metadata = { title: "API keys" }

const PATH = "/api-keys"
const WIDE = "hidden @4xl:table-cell"
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "pr-5 @4xl:pr-2"
const FILTERS: readonly ApiKeyFilter[] = ["active", "revoked"]
const SORTS: readonly ApiKeySort[] = ["createdAt", "requestCount"]
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Most requests", sort: "requestCount", dir: "desc" },
  { label: "Fewest requests", sort: "requestCount", dir: "asc" },
]

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    tabs: FILTERS,
    sorts: SORTS,
    defaultSort: "createdAt",
  })

  const [{ rows: keys, total }, counts] = await Promise.all([
    listApiKeys({
      q: list.q,
      limit: list.perPage,
      offset: list.offset,
      filter: list.tab,
      sort: list.sort ?? "createdAt",
      dir: list.dir,
    }),
    getApiKeyCounts(),
  ])
  if (keys.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  return (
    <AdminPage>
      <PageHeader
        title="API keys"
        description="Keys issued to organizations. This list is read-only and never shows a full key."
      />

      {counts.all === 0 ? (
        <Panel flush>
          <PanelEmpty
            className="py-12"
            title="No API keys yet"
            description="Keys show up here once a merchant creates one, with how often it's been used."
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
            searchLabel="Search name, prefix or organization"
            tabsLabel="Filter API keys by status"
            sorts={SORT_OPTIONS}
            currentSort={list}
            foldsAt="4xl"
            tabs={[
              { value: "", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "revoked", label: "Revoked", count: counts.revoked },
            ]}
          />
          {keys.length > 0 ? (
            <>
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className={WIDE}>Prefix</TableHead>
                    <TableHead className={EDGE}>Status</TableHead>
                    <SortableHead
                      list={list}
                      pathname={PATH}
                      field="requestCount"
                      firstDirection="desc"
                      align="right"
                      className={WIDE}
                    >
                      Requests
                    </SortableHead>
                    <TableHead className={WIDE}>Organization</TableHead>
                    <TableHead className={WIDE}>Last used</TableHead>
                    <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                      Created
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className={`${FOLD_CELL_4XL} font-medium`}>
                        {key.name ?? <NoValue />}
                        <div className="truncate text-xs font-normal text-muted-foreground @4xl:hidden">
                          {key.orgName ?? key.start}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground @4xl:hidden">
                          {plural(key.requestCount, "request")}
                        </div>
                      </TableCell>
                      <TableCell className={`${WIDE} font-mono text-xs text-muted-foreground`}>
                        {key.start ?? <NoValue />}
                      </TableCell>
                      <TableCell className={EDGE}>
                        <Status look={apiKeyStatus(key.enabled)} />
                      </TableCell>
                      <TableCell className={`${WIDE} text-right tabular-nums`}>
                        {formatNumber(key.requestCount)}
                      </TableCell>
                      <TableCell className={WIDE}>
                        {key.orgName ? (
                          <RowLink href={`/organizations/${key.organizationId}`}>{key.orgName}</RowLink>
                        ) : (
                          <NoValue />
                        )}
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                        {key.lastRequest ? <Timestamp date={key.lastRequest} /> : "Never"}
                      </TableCell>
                      <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                        <Timestamp date={key.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ListTable>
              <ListPagination list={list} pathname={PATH} total={total} noun="API key" />
            </>
          ) : (
            <PanelEmpty
              title="No API keys match"
              description="Nothing fits this search and status."
              action={
                <Button asChild variant="outline">
                  <Link href={PATH}>Show all API keys</Link>
                </Button>
              }
            />
          )}
        </Panel>
      )}
    </AdminPage>
  )
}
