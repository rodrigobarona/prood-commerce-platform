import Link from "next/link"
import { Progress } from "@prood/ui/components/progress"
import { cn } from "@prood/ui/lib/utils"
import { overPlanNote, type UsageRow } from "@/lib/plan-usage"

function amount({ used, limit }: UsageRow): string {
  const count = used.toLocaleString("en")
  return limit === null ? `${count}, no limit` : `${count} of ${limit.toLocaleString("en")}`
}

/** Plan use, one line each. The words carry the state; the meter only adds the shape of it. */
export function UsageMeters({ rows }: { rows: UsageRow[] }) {
  const note = overPlanNote(rows)
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <Link href={row.href} className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {row.label}
            </Link>
            <span className={cn("text-muted-foreground tabular-nums", row.over && "font-medium text-warning")}>
              {amount(row)}
              {row.over ? ", over your plan" : ""}
            </span>
          </div>
          {row.limit === null ? null : (
            <Progress
              value={row.percent}
              aria-label={`${row.label}: ${amount(row)}`}
              className={cn("h-1.5", row.over && "[&>[data-slot=progress-indicator]]:bg-warning")}
            />
          )}
        </li>
      ))}
      </ul>
      {note ? <p className="text-sm text-pretty text-muted-foreground">{note}</p> : null}
    </div>
  )
}
