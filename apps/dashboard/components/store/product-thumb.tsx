import Image from "next/image"
import { Package } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@prood/ui/lib/utils"

/**
 * Decorative, because the name always sits beside it. `unoptimized`, because the
 * API accepts images from any host and next/image throws on one it doesn't
 * know, which would take a whole list down with it.
 */
export function ProductThumb({ url, className }: { url?: string | null; className?: string }) {
  const frame = cn("size-10 shrink-0 rounded-lg border border-border", className)

  if (!url) {
    return (
      <span aria-hidden className={cn(frame, "flex items-center justify-center bg-muted text-muted-foreground")}>
        <Package className="size-4" />
      </span>
    )
  }
  return <Image src={url} alt="" width={40} height={40} unoptimized className={cn(frame, "object-cover")} />
}
