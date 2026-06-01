import { ChartLineUp } from "@phosphor-icons/react/dist/ssr"
import { DashboardEmpty } from "@/components/dashboard-empty"

export const metadata = { title: "Analytics" }

export default function AnalyticsPage() {
  return (
    <DashboardEmpty
      icon={ChartLineUp}
      title="Analytics"
      description="Track sales trends and store performance over time."
    >
      <p className="text-sm text-muted-foreground">
        This section is coming soon.
      </p>
    </DashboardEmpty>
  )
}
