import { Clock } from "@phosphor-icons/react/dist/ssr"
import { DashboardEmpty } from "@/components/dashboard-empty"

export function PlaceholderPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <DashboardEmpty
      icon={Clock}
      title={title}
      description={description}
    >
      {children ?? (
        <p className="text-sm text-muted-foreground">
          This section is coming soon.
        </p>
      )}
    </DashboardEmpty>
  )
}
