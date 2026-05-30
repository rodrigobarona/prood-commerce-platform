import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { mockOrders } from "@/lib/marketing-mocks"
import { formatDashboardPath } from "@/lib/site"
import { cn } from "@/lib/utils"

const statusStyles = {
  Paid: "bg-brand/12 text-brand ring-1 ring-brand/20",
  Fulfilled: "bg-muted text-muted-foreground",
  Pending: "bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-400",
} as const

export function OrdersTableMock({ className }: { className?: string }) {
  return (
    <MockChrome title="Orders" url={formatDashboardPath("orders")} className={className}>
      <p className="sr-only">Example orders table with status and totals</p>
      <div className="flex min-h-[280px]" aria-hidden>
        <aside className="hidden w-[4.5rem] shrink-0 border-r border-border/60 bg-muted/25 py-4 sm:block">
          <div className="mx-auto size-7 rounded-lg bg-foreground/90" />
          <div className="mt-6 space-y-2 px-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full",
                  i === 0 ? "w-full bg-brand/50" : "w-2/3 bg-border"
                )}
              />
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <span className="text-[13px] font-semibold tracking-[-0.02em]">Orders</span>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
              Last 7 days
            </span>
          </div>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Customer</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order, index) => (
                <tr
                  key={order.id}
                  className={cn(
                    "border-b border-border/30 transition-colors",
                    index === 0 && "bg-brand/[0.04]"
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-[11px]">{order.id}</td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">{order.customer}</td>
                  <td className="px-4 py-2.5 font-medium">{order.total}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-sm px-2 py-0.5 text-[10px] font-medium",
                        statusStyles[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MockChrome>
  )
}
