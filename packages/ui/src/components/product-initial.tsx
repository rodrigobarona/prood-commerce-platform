import { cn } from "@prood/ui/lib/utils"

/** The size of the initial on a short no-photo tile, wherever one appears. */
export const SHORT_TILE_INITIAL = "text-5xl md:text-6xl"

/**
 * A product with no photograph: its initial, set large on the tile, so a store
 * that hasn't shot anything yet still looks deliberate. Fills the nearest
 * positioned parent; pass a text size for the tile. The name beside it is what
 * reads aloud, so this stays hidden.
 */
export function ProductInitial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "font-heading text-muted-foreground/40 absolute inset-0 grid place-items-center leading-none select-none",
        className,
      )}
    >
      {Array.from(name.trim())[0]?.toUpperCase()}
    </span>
  )
}
