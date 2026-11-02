import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { FOLD_CELL_3XL, ListPagination, ListTable, RowLink, SortableHead } from "@prood/ui/components/list-table"
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
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { Timestamp } from "@/components/admin/timestamp"
import { getUserCounts, listUsers, type UserFilter, type UserSort } from "@/lib/admin-queries"
import { humanize } from "@/lib/format"
import { accountState } from "@/lib/status"

export const metadata = { title: "Users" }

const PATH = "/users"
const WIDE = "hidden @3xl:table-cell"
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "pr-5 @3xl:pr-2"
const FILTERS: readonly UserFilter[] = ["admin", "banned", "unverified"]
const SORTS: readonly UserSort[] = ["createdAt", "name", "email"]
const SORT_OPTIONS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Name, A to Z", sort: "name", dir: "asc" },
  { label: "Name, Z to A", sort: "name", dir: "desc" },
  { label: "Email, A to Z", sort: "email", dir: "asc" },
  { label: "Email, Z to A", sort: "email", dir: "desc" },
]

export default async function UsersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    tabParam: "show",
    tabs: FILTERS,
    sorts: SORTS,
    defaultSort: "createdAt",
  })

  const [{ rows: users, total }, counts] = await Promise.all([
    listUsers({
      q: list.q,
      limit: list.perPage,
      offset: list.offset,
      filter: list.tab,
      sort: list.sort ?? "createdAt",
      dir: list.dir,
    }),
    getUserCounts(),
  ])
  if (users.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  return (
    <AdminPage>
      <PageHeader title="Users" description="Everyone with a Prood account." />

      {counts.all === 0 ? (
        <Panel flush>
          <PanelEmpty
            className="py-12"
            title="No users yet"
            description="Accounts show up here as soon as someone signs up on Prood."
          />
        </Panel>
      ) : (
        <Panel flush>
          <ListToolbar
            searchLabel="Search name or email"
            tabParam="show"
            tabsLabel="Filter users"
            sorts={SORT_OPTIONS}
            currentSort={list}
            foldsAt="3xl"
            tabs={[
              { value: "", label: "All", count: counts.all },
              { value: "admin", label: "Admins", count: counts.admin },
              { value: "banned", label: "Banned", count: counts.banned },
              { value: "unverified", label: "Unverified", count: counts.unverified },
            ]}
          />
          {users.length > 0 ? (
            <>
              <ListTable>
                <TableHeader>
                  <TableRow>
                    <SortableHead list={list} pathname={PATH} field="name">
                      Name
                    </SortableHead>
                    <SortableHead list={list} pathname={PATH} field="email" className={WIDE}>
                      Email
                    </SortableHead>
                    <TableHead className={WIDE}>Role</TableHead>
                    <TableHead className={EDGE}>Status</TableHead>
                    <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                      Joined
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    return (
                      <TableRow key={user.id} className="relative">
                        <TableCell className={FOLD_CELL_3XL}>
                          <RowLink href={`/users/${user.id}`} stretch>
                            {user.name}
                          </RowLink>
                          <div className="truncate text-xs text-muted-foreground @3xl:hidden">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className={`${WIDE} text-muted-foreground`}>{user.email}</TableCell>
                        <TableCell className={`${WIDE} text-muted-foreground`}>{humanize(user.role)}</TableCell>
                        <TableCell className={EDGE}>
                          <Status look={accountState(user)} />
                        </TableCell>
                        <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                          <Timestamp date={user.createdAt} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </ListTable>
              <ListPagination list={list} pathname={PATH} total={total} noun="user" />
            </>
          ) : (
            <PanelEmpty
              title="No users match"
              description="Nobody fits this search and filter."
              action={
                <Button asChild variant="outline">
                  <Link href={PATH}>Show all users</Link>
                </Button>
              }
            />
          )}
        </Panel>
      )}
    </AdminPage>
  )
}
