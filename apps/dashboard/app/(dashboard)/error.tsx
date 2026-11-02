"use client"

import { useEffect } from "react"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { DashboardPage } from "@/components/layout/dashboard-page"

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard] Unhandled error:", error)
  }, [error])

  return (
    <DashboardPage>
      <PageHeader
        title="We couldn't load this page"
        description="Something went wrong on our side. Try again, and if it keeps happening, come back in a few minutes."
        actions={<Button onClick={() => retry()}>Try again</Button>}
      />
      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          Reference <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </DashboardPage>
  )
}
