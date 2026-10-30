import { CheckCircleIcon, GlobeSimpleIcon, LockSimpleIcon, RobotIcon } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@prood/ui/lib/utils"

const paymentMethods = ["Card", "Apple Pay", "Google Pay", "Multibanco", "MB WAY"] as const

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-[0_1px_0_0_var(--border),0_12px_32px_-16px_oklch(0.2_0.02_260/0.18)]", className)}>
      {children}
    </div>
  )
}

function PanelLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[0.6875rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
      <span className="text-brand [&_svg]:size-4">{icon}</span>
      {children}
    </p>
  )
}

/**
 * Illustration of the three things a merchant keeps: their domain, their
 * payment accounts and the final say over what agents may do. Decorative
 * sample data, described for assistive tech by the figure caption.
 */
export function HeroVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
      <figcaption className="sr-only">
        Example store: a custom domain with HTTPS ready, a checkout offering card, Apple Pay,
        Google Pay, Multibanco and MB WAY, and an AI agent asking the merchant for permission to refund orders.
      </figcaption>
      <div aria-hidden className="grid gap-4 lg:pl-8">
        <Panel>
          <PanelLabel icon={<GlobeSimpleIcon />}>Your domain</PanelLabel>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm">
            <LockSimpleIcon className="size-4 shrink-0 text-success" weight="bold" />
            <span className="truncate">shop.atelier-sol.pt</span>
            <span className="ml-auto shrink-0 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
              HTTPS
            </span>
          </div>
          <p className="mt-2 font-mono text-xs text-muted-foreground">also live at atelier-sol.prood.app</p>
        </Panel>

        <Panel className="lg:-ml-8">
          <div className="flex items-baseline justify-between gap-4">
            <PanelLabel icon={<CheckCircleIcon />}>Your payment accounts</PanelLabel>
            <p className="text-sm font-semibold tabular-nums">€86.00</p>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-sm",
                  method === "MB WAY"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background"
                )}
              >
                {method}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">Paid out by your provider, straight to you.</p>
        </Panel>

        <Panel>
          <PanelLabel icon={<RobotIcon />}>Agent request</PanelLabel>
          <p className="mt-4 text-[0.9375rem] leading-6">
            <span className="font-medium">Support assistant</span> is asking for permission to
            refund orders.
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">capability: adminRefundOrder</p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex h-8 items-center rounded-2xl border border-border px-3 text-sm font-medium">
              Deny
            </span>
            <span className="inline-flex h-8 items-center rounded-2xl bg-primary px-3 text-sm font-medium text-primary-foreground">
              Allow
            </span>
          </div>
        </Panel>
      </div>
    </figure>
  )
}
