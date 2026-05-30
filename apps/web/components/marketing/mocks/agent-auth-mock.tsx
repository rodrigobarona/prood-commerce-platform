import { RobotIcon } from "@phosphor-icons/react/dist/ssr"

import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { formatDashboardPath } from "@/lib/site"

export function AgentAuthMock({ className }: { className?: string }) {
  return (
    <MockChrome title="Agent Auth" url={formatDashboardPath("settings/api-keys")} className={className}>
      <p className="sr-only">Example Agent Auth capability approval</p>
      <div className="space-y-3 p-4" aria-hidden>
        <div className="rounded-md border border-border/80 bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              <RobotIcon className="size-4 text-brand" weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold tracking-[-0.02em]">Inventory assistant</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                catalog:write · orders:read
              </p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-sm bg-brand px-2.5 py-1 text-[10px] font-medium text-brand-foreground">
                  Approve
                </span>
                <span className="rounded-md border border-border bg-card px-2.5 py-1 text-[10px]">
                  Deny
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-3 py-2.5 text-center text-[11px] text-muted-foreground">
          Mutations require merchant approval
        </div>
      </div>
    </MockChrome>
  )
}
