"use client"

import { useState } from "react"
import Image from "next/image"
import type { Image as ImageType } from "@prood/types"
import { cn } from "@prood/ui/lib/utils"

export interface ProductGalleryProps {
  images: ImageType[]
  alt?: string
  className?: string
}

export function ProductGallery({ images, alt = "", className }: ProductGalleryProps) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return <div className={cn("bg-muted aspect-square rounded-2xl", className)} />
  }

  const main = images[Math.min(active, images.length - 1)]!

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl">
        <Image
          src={main.url}
          alt={main.alt || alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, i) => (
            <button
              // eslint-disable-next-line @eslint-react/no-array-index-key -- the same URL may repeat
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              data-active={i === active}
              className={cn(
                "bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `${alt} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
