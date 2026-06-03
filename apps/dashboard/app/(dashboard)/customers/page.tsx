import { Suspense } from "react"
import Link from "next/link"
import { Users } from "@phosphor-icons/react/dist/ssr"
import type { Customer } from "@prood/commerce"
import { DashboardEmpty } from "@/components/dashboard-empty"
import { Button } from "@prood/ui/components/button"
import { Card, CardContent } from "@prood/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { TablePageSkeleton } from "@/components/skeletons"
import { listCustomers } from "@/lib/admin-api"

export const metadata = { title: "Customers" }

function fullName(customer: Customer): string {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ")
  return name || "—"
}

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Customers</h2>
        <p className="text-sm text-muted-foreground">
          People who have shopped at your store.
        </p>
      </div>

      <Suspense fallback={<TablePageSkeleton columns={4} />}>
        <CustomersTable />
      </Suspense>
    </div>
  )
}

async function CustomersTable() {
  let customers: Customer[] = []
  let failed = false
  try {
    const result = await listCustomers({ page: 1, perPage: 50 })
    customers = result.items
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    failed = true
  }

  return (
    <Card>
      <CardContent className="px-0">
        {customers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="pl-5 font-medium">
                    {fullName(customer)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/customers/${customer.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <DashboardEmpty
            className="border-0 py-10"
            icon={Users}
            title={failed ? "Customers unavailable" : "No customers yet"}
            description={
              failed
                ? "Could not load customers. Check the API connection."
                : "Customers appear here after their first purchase."
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
