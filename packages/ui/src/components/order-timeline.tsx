import { CheckIcon } from "@phosphor-icons/react/dist/ssr"
import type { OrderStatus } from "@prood/types"
import { cn } from "@prood/ui/lib/utils"

const FLOW: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Placed" },
  { status: "approved", label: "Paid" },
  { status: "fulfilled", label: "Fulfilled" },
]

export interface OrderTimelineProps {
  status: OrderStatus
  className?: string
}

export function OrderTimeline({ status, className }: OrderTimelineProps) {
  if (status === "cancelled") {
    return <p className={cn("text-destructive text-sm", className)}>This order was canceled.</p>
  }

  const currentIndex = FLOW.findIndex((step) => step.status === status)

  return (
    <ol className={cn("grid grid-cols-3 gap-2", className)}>
      {FLOW.map((step, i) => {
        const done = i <= currentIndex
        return (
          <li
            key={step.status}
            aria-current={i === currentIndex ? "step" : undefined}
            className="flex flex-col gap-2"
          >
            <span className={cn("h-1 rounded-full", done ? "bg-foreground" : "bg-muted")} />
            <span
              className={cn(
                "flex items-center gap-1 text-sm",
                done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {done ? <CheckIcon weight="bold" className="size-3.5" /> : null}
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
