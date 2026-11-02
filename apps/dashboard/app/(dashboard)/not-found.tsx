import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { DashboardPage } from "@/components/layout/dashboard-page"

export const metadata = { title: "Page not found" }

export default function DashboardNotFound() {
  return (
    <DashboardPage>
      <PageHeader
        title="We couldn't find that page"
        description="It may have been deleted, or it belongs to a different store. Check the address, or switch stores in the sidebar."
        actions={
          <Button asChild>
            <Link href="/">Go to overview</Link>
          </Button>
        }
      />
    </DashboardPage>
  )
}
