"use client"

import { useEffect, useState } from "react"
import { Button } from "@prood/ui/components/button"

export function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard refused: the number is on screen to copy by hand.
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} aria-label={label}>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </Button>
  )
}
