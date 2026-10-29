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
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.round(rating)
          return (
            <StarIcon
              // eslint-disable-next-line @eslint-react/no-array-index-key -- fixed star positions
              key={i}
              size={size}
              weight={filled ? "fill" : "regular"}
              className={filled ? "text-amber-500" : "text-muted-foreground/40"}
            />
          )
        })}
      </div>
      {showValue ? (
        <span className="text-muted-foreground text-sm">{rating.toFixed(1)}</span>
      ) : null}
      {count != null ? (
        <span className="text-muted-foreground text-sm">({count})</span>
      ) : null}
    </div>
  )
}
