import { StarIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@prood/ui/lib/utils"

export interface ReviewStarsProps {
  rating: number
  max?: number
  size?: number
  showValue?: boolean
  count?: number
  className?: string
}

export function ReviewStars({
  rating,
  max = 5,
  size = 16,
  showValue = false,
  count,
  className,
}: ReviewStarsProps) {
  const label = `Rated ${rating.toFixed(1)} out of ${max}${
    count != null ? ` from ${count} ${count === 1 ? "review" : "reviews"}` : ""
  }`

  return (
    <div role="img" aria-label={label} className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-px">
        {Array.from({ length: max }).map((_, i) => {
          const fill = Math.min(Math.max(rating - i, 0), 1)
          return (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- fixed star positions
            <span key={i} className="relative block" style={{ width: size, height: size }}>
              <StarIcon size={size} className="text-muted-foreground/50 absolute inset-0" />
              {fill > 0 ? (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <StarIcon size={size} weight="fill" className="text-foreground max-w-none" />
                </span>
              ) : null}
            </span>
          )
        })}
      </div>
      {showValue ? (
        <span className="text-muted-foreground text-sm tabular-nums">{rating.toFixed(1)}</span>
      ) : null}
      {count != null ? (
        <span className="text-muted-foreground text-sm tabular-nums">({count})</span>
      ) : null}
    </div>
  )
}
