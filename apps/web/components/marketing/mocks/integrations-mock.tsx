import { MockChrome } from "@/components/marketing/mocks/mock-chrome"
import { mockIntegrations } from "@/lib/marketing-mocks"
import { formatDashboardPath } from "@/lib/site"
import { cn } from "@/lib/utils"

export function IntegrationsMock({ className }: { className?: string }) {
  return (
    <MockChrome title="Integrations" url={formatDashboardPath("integrations")} className={className}>
      <p className="sr-only">Example payment integrations per store</p>
      <ul className="divide-y divide-border/50 p-1" aria-hidden>
        {mockIntegrations.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center justify-between px-4 py-3.5",
              index === 0 && "bg-brand/[0.03]"
            )}
          >
            <span className="text-[13px] font-semibold tracking-[-0.02em]">{item.name}</span>
            <span
              className={cn(
                "rounded-sm px-2.5 py-0.5 text-[10px] font-medium",
                item.status === "Connected"
                  ? "bg-brand/12 text-brand"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </MockChrome>
  )
}
