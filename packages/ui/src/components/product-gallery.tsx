"use client"

import { useState } from "react"
import Image from "next/image"
import type { Image as ImageType } from "@prood/types"
import { ProductInitial, SHORT_TILE_INITIAL } from "@prood/ui/components/product-initial"
import { cn } from "@prood/ui/lib/utils"

export interface ProductGalleryProps {
  images: ImageType[]
  alt?: string
  className?: string
}

/**
 * Photographs side by side on a phone, swiped with the thumb, and laid out from
 * `lg`, where the buy box stays beside them as the page scrolls. Only the first
 * runs full size: the rest are details, and hold up better at half width. A pair
 * has no detail to rank below it, so it stands as two equal tiles. With nothing
 * to show, a short quiet panel, so the empty space doesn't lead the page.
 */
export function ProductGallery({ images, alt = "", className }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const pair = images.length === 2

  if (images.length === 0) {
    return (
      <div className={cn("bg-muted relative aspect-[2/1] md:rounded-lg lg:aspect-[3/2] lg:self-start", className)}>
        <ProductInitial name={alt} className={SHORT_TILE_INITIAL} />
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <div
        role="group"
        aria-label={`Photos of ${alt}`}
        tabIndex={images.length > 1 ? 0 : undefined}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget
          setActive(Math.round(scrollLeft / clientWidth))
        }}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-ring lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, i) => (
          <div
            // eslint-disable-next-line @eslint-react/no-array-index-key -- the same URL may repeat
            key={`${image.url}-${i}`}
            className={cn(
              "bg-muted relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden lg:rounded-lg",
              i === 0 && !pair && "lg:col-span-2",
            )}
          >
            <Image
              src={image.url}
              alt={image.alt || (images.length > 1 ? `${alt}, photo ${i + 1}` : alt)}
              fill
              preload={i === 0}
              // Wider than the frame: a landscape photo fills this 4:5 by height.
              sizes={i === 0 && !pair ? "(min-width: 1024px) 96vw, 160vw" : "(min-width: 1024px) 48vw, 160vw"}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <p
          aria-hidden
          className="bg-background/90 absolute right-3 bottom-3 rounded-md px-2 py-1 text-xs tabular-nums lg:hidden"
        >
          {Math.min(active, images.length - 1) + 1} / {images.length}
        </p>
      ) : null}
    </div>
  )
}
