import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { BillingSkeleton, PageHeaderSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <DashboardFormPage>
      <PageHeaderSkeleton />
      <BillingSkeleton />
    </DashboardFormPage>
  )
}
