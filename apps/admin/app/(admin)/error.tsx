"use client"

import { useEffect } from "react"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error("[admin] page failed to load:", error)
  }, [error])

  return (
    <AdminPage>
      <PageHeader
        title="We couldn't load this page"
        description="The platform database or API didn't respond, so we can't show current data. Try again, and if it keeps failing, check their status."
        actions={<Button onClick={() => retry()}>Try again</Button>}
      />
      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          Reference <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </AdminPage>
  )
}
