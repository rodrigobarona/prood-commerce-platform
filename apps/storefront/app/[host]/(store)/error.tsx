"use client"

import { useEffect } from "react"
import { EmptyState } from "@prood/ui/components/empty-state"

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
    <EmptyState
      headingLevel="h1"
      title="Something went wrong"
      description="We couldn't load this page. Try again in a moment."
      actionLabel="Try again"
      onAction={() => retry()}
      className="flex-1"
    />
  )
}
