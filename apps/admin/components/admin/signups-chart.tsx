"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@prood/ui/components/tooltip"

export interface SignupDay {
  date: string
  label: string
  count: number
}

/** Whole numbers only: half a signup isn't a thing. */
function axisTicks(peak: number): number[] {
  if (peak <= 1) return [0, 1]
  return peak % 2 === 0 ? [0, peak / 2, peak] : [0, peak]
}

/**
 * New accounts per day, one column per day, zero days included. The axis starts
 * at zero and runs to the busiest day, so a column's height reads as a count.
 */
export function SignupsChart({ days }: { days: SignupDay[] }) {
  const peak = Math.max(...days.map((day) => day.count), 1)
  const ticks = axisTicks(peak)

  return (
    <figure className="flex flex-col gap-2">
      <div aria-hidden className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <div className="relative h-32 min-w-3 text-right text-xs text-muted-foreground tabular-nums">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 leading-none"
              style={{ bottom: `${(tick / peak) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="relative h-32 border-b border-border">
          {ticks.slice(1).map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ bottom: `${(tick / peak) * 100}%` }}
            />
          ))}
          <TooltipProvider delayDuration={0}>
            <div className="absolute inset-0 flex items-stretch">
              {days.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div className="group flex min-w-0 flex-1 items-end justify-center px-px">
                      <div
                        className="w-full max-w-3 rounded-t-[4px] bg-foreground/70 group-hover:bg-foreground"
                        style={{ height: `${(day.count / peak) * 100}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-medium tabular-nums">{day.count}</span> on {day.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
        <span />
        <figcaption className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{days[0]?.label}</span>
          <span>{days.at(-1)?.label}</span>
        </figcaption>
      </div>
      <table className="sr-only">
        <caption>Signups per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Signups</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{day.label}</td>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
