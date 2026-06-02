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
      toast.success("Copied to clipboard")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0"
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
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-3 space-y-1">
        <p className="text-sm font-medium">DNS records for {domain}</p>
        <p className="text-xs text-muted-foreground">
          Add these at your domain registrar, then click Verify. Propagation can
          take a few minutes up to 48 hours.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium">Name / Host</th>
              <th className="pb-2 font-medium">Value</th>
              <th className="pb-2 w-10" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={`${record.type}-${record.host}-${record.value}`} className="border-b last:border-0">
                <td className="py-2.5 pr-4 align-top font-mono text-xs">{record.type}</td>
                <td className="py-2.5 pr-4 align-top">
                  <code className="break-all rounded bg-background px-1.5 py-0.5 text-xs">
                    {record.host}
                  </code>
                </td>
                <td className="py-2.5 align-top">
                  <div className="flex items-start gap-1">
                    <code className="break-all rounded bg-background px-1.5 py-0.5 text-xs">
                      {record.value}
                    </code>
                    <CopyValueButton value={record.value} />
                  </div>
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
