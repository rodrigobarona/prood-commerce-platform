import Link from "next/link"
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import type { SetupItem } from "@/lib/setup-checklist"

export function SetupChecklist({ items }: { items: SetupItem[] }) {
  const done = items.filter((item) => item.done).length
  if (done === items.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get your store ready to sell</CardTitle>
        <CardDescription>
          {done} of {items.length} done.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              {item.done ? (
                <CheckCircle weight="fill" className="size-4 shrink-0 text-success" aria-label="Done" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="To do" />
              )}
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">{item.title}</span>
                {item.done ? null : (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
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
      </CardContent>
    </Card>
  )
}
