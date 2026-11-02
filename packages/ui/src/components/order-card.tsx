import Link from "next/link"
import type { Order, OrderStatus } from "@prood/types"
import { StatusBadge, type StatusTone } from "@prood/ui/components/status-badge"
import { formatDate, formatPrice, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

const STATUS: Record<OrderStatus, { tone: StatusTone; label: string }> = {
  placed: { tone: "neutral", label: "Placed" },
  approved: { tone: "info", label: "Approved" },
  fulfilled: { tone: "success", label: "Fulfilled" },
  cancelled: { tone: "danger", label: "Canceled" },
}

export interface OrderCardProps {
  order: Order
  href: string
  locale?: Locale
  className?: string
}

export function OrderCard({ order, href, locale = "en", className }: OrderCardProps) {
  const status = STATUS[order.status]
  const items = order.items.length

  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-muted/50 focus-visible:ring-ring flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2 sm:p-5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-sm">#{order.orderNumber}</span>
        <span className="text-muted-foreground text-sm">
          {formatDate(order.createdAt)} · {items} {items === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-sm tabular-nums">{formatPrice(order.totals.total, locale)}</span>
        <StatusBadge tone={status.tone} filled>{status.label}</StatusBadge>
      </div>
    </Link>
  )
}
