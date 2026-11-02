import { DashboardPage } from "@/components/layout/dashboard-page"
import { PageHeaderSkeleton, StatsSkeleton, TablePanelSkeleton } from "@/components/skeletons"

export default function DashboardLoading() {
  return (
    <DashboardPage>
      <PageHeaderSkeleton action />
      <StatsSkeleton />
      <TablePanelSkeleton rows={5} />
    </DashboardPage>
  )
}
