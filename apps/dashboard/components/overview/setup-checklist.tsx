import Link from "next/link"
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { Panel } from "@prood/ui/components/panel"
import type { SetupItem } from "@/lib/setup-checklist"

export function SetupChecklist({
  items,
  storeUrl,
  shipping,
}: {
  items: SetupItem[]
  storeUrl?: string | null
  /** A fact to know before selling, not a step: there's nothing to do about it yet, as with the pages below. */
  shipping?: string
}) {
  const done = items.filter((item) => item.done).length
  if (done === items.length) return null

  return (
    <Panel
      title="Get your store ready to sell"
      description={`${done} of ${items.length} done.${storeUrl ? ` Your store's address is ${new URL(storeUrl).host}.` : ""}`}
      flush
      footer={
        <div className="flex flex-col gap-1 text-sm text-pretty text-muted-foreground">
          {shipping ? <p>{shipping}</p> : null}
          <p>Returns, terms and privacy pages: coming later.</p>
        </div>
      }
    >
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
            {item.done ? (
              <CheckCircle weight="fill" className="size-4 shrink-0 text-success" aria-label="Done" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="To do" />
            )}
            <div className="flex min-w-0 flex-1 basis-48 flex-col">
              <span className={item.done ? "text-sm text-muted-foreground" : "text-sm font-medium"}>
                {item.title}
              </span>
              {item.done ? null : (
                <span className="text-sm text-pretty text-muted-foreground">{item.description}</span>
              )}
            </div>
            {item.done || item.blocked ? null : (
              <Button asChild size="sm" variant="outline">
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.action}
                  </a>
                ) : (
                  <Link href={item.href}>{item.action}</Link>
                )}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}
