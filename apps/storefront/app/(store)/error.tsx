"use client"

import { useEffect } from "react"
import { Button } from "@prood/ui/components/button"

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t load this page. Try again in a moment.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  )
}
