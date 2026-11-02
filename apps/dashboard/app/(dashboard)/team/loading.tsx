import { DashboardPage } from "@/components/layout/dashboard-page"
import { FormPanelSkeleton, PageHeaderSkeleton, TablePanelSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <DashboardPage>
      <PageHeaderSkeleton />
      <FormPanelSkeleton fields={1} />
      <TablePanelSkeleton rows={3} />
    </DashboardPage>
  )
}
