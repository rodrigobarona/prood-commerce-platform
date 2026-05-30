import { CheckIcon, GlobeIcon } from "@phosphor-icons/react/dist/ssr"

import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { mockCustomDomain, mockSubdomain } from "@/lib/marketing-mocks"
import { formatDashboardPath } from "@/lib/site"
import { cn } from "@/lib/utils"

export function DomainsMock({ className }: { className?: string }) {
  return (
    <MockChrome title="Domains" url={formatDashboardPath("domains")} className={className}>
      <p className="sr-only">Example domain settings with subdomain and verified custom domain</p>
      <ul className="divide-y divide-border/50" aria-hidden>
        <li className="flex items-center justify-between gap-4 bg-muted/15 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <GlobeIcon className="size-4 text-brand" weight="duotone" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[12px]">{mockSubdomain}</p>
              <p className="text-[11px] text-muted-foreground">Subdomain · included</p>
            </div>
          </div>
          <span className="shrink-0 rounded-sm bg-brand/12 px-2 py-0.5 text-[10px] font-medium text-brand">
            Live
          </span>
        </li>
        <li className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <CheckIcon className="size-4 text-brand" weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[12px]">{mockCustomDomain}</p>
              <p className="text-[11px] text-muted-foreground">Custom domain · verified</p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-sm bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            )}
          >
            SSL
          </span>
        </li>
      </ul>
    </MockChrome>
  )
}
