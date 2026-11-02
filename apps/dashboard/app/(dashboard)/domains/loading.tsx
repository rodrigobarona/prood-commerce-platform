import { DashboardPage } from "@/components/layout/dashboard-page"
import { DomainsSkeleton, PageHeaderSkeleton } from "@/components/skeletons"

export default function Loading() {
  return (
    <DashboardPage>
      <PageHeaderSkeleton />
      <DomainsSkeleton />
    </DashboardPage>
  )
}
