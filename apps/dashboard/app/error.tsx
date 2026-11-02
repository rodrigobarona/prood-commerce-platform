"use client"

import { useEffect } from "react"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"

export default function RootError({
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
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center px-6 py-8">
      <PageHeader
        title="We couldn't load this page"
        description="Something went wrong on our side. Try again, and if it keeps happening, come back in a few minutes."
        actions={<Button onClick={() => retry()}>Try again</Button>}
      />
    </main>
  )
}
