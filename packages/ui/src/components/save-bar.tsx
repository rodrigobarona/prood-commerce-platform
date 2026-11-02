"use client"

import { useEffect, useRef, type FocusEvent } from "react"

import { Button } from "@prood/ui/components/button"

/** Asks before a reload or a closed tab drops unsaved work. */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
}

/**
 * The bar leaves the page once a form is saved or discarded, and focus would go
 * with it. This remembers the last field used, to put focus back there.
 */
export function useFocusReturn() {
  const fieldRef = useRef<HTMLElement | null>(null)

  return {
    trackFocus(event: FocusEvent<HTMLFormElement>) {
      if (!event.target.closest("[data-save-bar]")) fieldRef.current = event.target
    },
    returnFocus() {
      fieldRef.current?.focus()
    },
  }
}

/**
 * Save stays in reach on a long form: this rides the bottom of the viewport.
 * Keep it the form's last child. The floating layer may use a shadow.
 */
export function SaveBar({
  visible,
  pending,
  message = "You have unsaved changes.",
  saveLabel,
  pendingLabel = "Saving...",
  onDiscard,
}: {
  visible: boolean
  pending: boolean
  message?: string | null
  saveLabel: string
  pendingLabel?: string
  onDiscard?: () => void
}) {
  if (!visible) return null

  return (
    <div data-save-bar className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg">
      <p role="status" className="min-w-0 text-sm text-muted-foreground">
        {message}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {onDiscard ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={onDiscard}>
            Discard
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : saveLabel}
        </Button>
      </div>
    </div>
  )
}
