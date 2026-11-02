"use client"

import { useState } from "react"
import { Copy, Check } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import type { DnsRecord } from "@/lib/dns-records"

function CopyValueButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success("Value copied.")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("We couldn't copy that. Select it and copy it by hand.")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="-mt-1 shrink-0"
      onClick={handleCopy}
      aria-label="Copy value"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

export function DomainDnsInstructions({
  domain,
  records,
}: {
  domain: string
  records: DnsRecord[]
}) {
  if (records.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">DNS records for {domain}</p>
      <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
        Add these where you bought the domain, then verify it. DNS changes can take from a few minutes to 48 hours.
      </p>
      <div className="mt-3">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="pr-4 pb-2 font-medium">Type</th>
              <th className="pr-4 pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={`${record.type}-${record.host}-${record.value}`} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 align-top font-mono text-xs">{record.type}</td>
                <td className="py-2 pr-4 align-top font-mono text-xs break-all">{record.host}</td>
                <td className="py-2 align-top">
                  <div className="flex items-start gap-1">
                    <span className="min-w-0 flex-1 font-mono text-xs break-all">{record.value}</span>
                    <CopyValueButton value={record.value} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
