"use client"

import { useEffect } from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard] Unhandled error:", error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <WarningCircle className="size-12 text-destructive" />
      <div className="text-center">
        <h2 className="font-heading text-lg font-medium">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An unexpected error occurred while loading this page.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
