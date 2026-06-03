import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Skeleton } from "@prood/ui/components/skeleton"

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <CardDescription>
              <Skeleton className="h-4 w-16" />
            </CardDescription>
            <CardTitle>
              <Skeleton className="h-8 w-24" />
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

export function RecentOrdersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Latest activity in your store.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
          >
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function TablePageSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <Card>
      <CardContent className="px-0">
        <div className="w-full">
          <div className="flex items-center gap-4 border-b px-5 py-3">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex-1">
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b px-5 py-4 last:border-0"
            >
              {Array.from({ length: columns }).map((_, j) => (
                <div key={j} className="flex-1">
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  )
}

export function IntegrationsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Card key={j} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="mt-1 h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function DomainsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-48 rounded-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}

export function BillingSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-72" />
      <div className="mt-4 w-full max-w-lg space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}
