import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Customer } from "@prood/commerce"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Skeleton } from "@prood/ui/components/skeleton"
import { getCustomer } from "@/lib/admin-api"

export const metadata = { title: "Customer" }

function fullName(customer: Customer): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div>
            <Skeleton className="h-7 w-36" />
            <Skeleton className="mt-1 h-4 w-48" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      }
    >
      <CustomerDetail params={params} />
    </Suspense>
  )
}

async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let customer: Customer
  try {
    customer = await getCustomer(id)
  } catch {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">
          {fullName(customer)}
        </h2>
        <p className="text-sm text-muted-foreground">{customer.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{customer.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {customer.addresses.length > 0 ? (
              customer.addresses.map((address) => (
                <address
                  key={address.id}
                  className="not-italic text-muted-foreground"
                >
                  <span className="block font-medium text-foreground">
                    {address.firstName} {address.lastName}
                  </span>
                  {address.street}
                  {address.street2 ? `, ${address.street2}` : ""}
                  <br />
                  {address.city}
                  {address.state ? `, ${address.state}` : ""}{" "}
                  {address.postalCode ?? ""}
                  <br />
                  {address.country}
                </address>
              ))
            ) : (
              <p className="text-muted-foreground">No saved addresses.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
