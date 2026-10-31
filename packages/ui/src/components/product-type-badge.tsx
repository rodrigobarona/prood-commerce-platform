import { Badge } from "@prood/ui/components/badge"

export interface ProductTypeBadgeProps {
  type: string
  className?: string
}

const LABELS: Record<string, string> = {
  physical: "Product",
  digital: "Digital",
  subscription: "Subscription",
  event: "Event",
  service: "Service",
}

export function ProductTypeBadge({ type, className }: ProductTypeBadgeProps) {
  const label = LABELS[type] ?? type
  if (type === "physical") return null
  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  )
}
