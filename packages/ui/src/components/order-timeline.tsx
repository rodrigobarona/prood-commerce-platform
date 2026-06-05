import type { OrderStatus } from "@prood/types"
import { cn } from "@prood/ui/lib/utils"

const FLOW: OrderStatus[] = ["placed", "approved", "fulfilled"]

export interface OrderTimelineProps {
  status: OrderStatus
  className?: string
}

export function OrderTimeline({ status, className }: OrderTimelineProps) {
  const terminal = status === "cancelled"
  const currentIndex = FLOW.indexOf(status)

  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {terminal ? (
        <li className="text-destructive text-sm font-medium capitalize">{status}</li>
      ) : (
        FLOW.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cn(
                "size-3 rounded-full",
                i <= currentIndex ? "bg-primary" : "bg-border",
              )}
            />
            <span
              className={cn(
                "text-sm capitalize",
                i <= currentIndex ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step}
            </span>
          </li>
        ))
      )}
    </ol>
  )
}
