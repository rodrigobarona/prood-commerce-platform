"use client"

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Check, Copy } from "@phosphor-icons/react"

import { Button } from "@prood/ui/components/button"
import { cn } from "@prood/ui/lib/utils"

/** Lets a long value wrap at its own seams, so `async_payment_succeeded` never splits inside a word. */
function withBreaks(value: string): ReactNode[] {
  let offset = 0
  return value.split(/(?<=[./_-])/).map((part) => {
    const start = offset
    offset += part.length
    return (
      <Fragment key={start}>
        {start > 0 ? <wbr /> : null}
        {part}
      </Fragment>
    )
  })
}

function useCopy(value: string, label: string) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
      toast.success(`Copied the ${label}.`)
    } catch {
      toast.error(`We couldn't copy the ${label}. Select it and copy it by hand.`)
    }
  }

  return { copied, copy }
}

/**
 * A value someone has to carry somewhere else: a URL, a key, a list of events.
 * It wraps whole, never clips, and copies in one press. Multi-line values keep
 * their lines.
 */
export function CopyBlock({
  value,
  label,
  className,
}: {
  value: string
  /** What it is, for the button's name and the confirmation: "webhook URL". */
  label: string
  className?: string
}) {
  const { copied, copy } = useCopy(value, label)

  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-border bg-muted/50 py-1.5 pr-1.5 pl-3", className)}>
      <code className="min-w-0 flex-1 py-1 font-mono text-xs/5 wrap-anywhere whitespace-pre-wrap">{withBreaks(value)}</code>
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check weight="bold" /> : <Copy />}
      </Button>
    </div>
  )
}

const SHORT_START = 8
const SHORT_END = 4

/** A long identifier in a tight spot: the ends of it, in full on hover, copied whole. */
export function CopyValue({ value, label, className }: { value: string; label: string; className?: string }) {
  const { copied, copy } = useCopy(value, label)
  const short = value.length > SHORT_START + SHORT_END + 1
  const shown = short ? `${value.slice(0, SHORT_START)}…${value.slice(-SHORT_END)}` : value

  return (
    <span className={cn("inline-flex items-center gap-1 align-middle", className)}>
      <code className="font-mono text-xs" title={value}>
        {shown}
      </code>
      <Button type="button" variant="ghost" size="icon-xs" className="-my-2.5 -mr-2.5 md:-my-1 md:-mr-1" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check weight="bold" /> : <Copy />}
      </Button>
    </span>
  )
}
