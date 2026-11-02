import Image from "next/image"
import Link from "next/link"
import type { Category, Image as ImageType } from "@prood/types"
import { ProductInitial } from "@prood/ui/components/product-initial"
import { localized } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface CategoryTile {
  category: Category
  image: ImageType | null
}

const COLUMNS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
}

export function CategoryTiles({ tiles }: { tiles: CategoryTile[] }) {
  // On a phone an odd tile out would leave a hole, so the first one takes the row.
  const lead = tiles.length % 2 === 1

  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5", COLUMNS[tiles.length])}>
      {tiles.map(({ category, image }, index) => {
        const name = localized(category.name)
        return (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className={cn("group/tile flex flex-col gap-3", lead && index === 0 && "col-span-2 md:col-span-1")}
          >
            <span
              className={cn(
                "bg-muted relative block overflow-hidden rounded-lg",
                lead && index === 0 ? "aspect-[4/3] md:aspect-[4/5]" : "aspect-[4/5]",
              )}
            >
              {image ? (
                <Image
                  src={image.url}
                  alt={image.alt || name}
                  fill
                  // Wider than the tile: a landscape photo fills this 4:5 by height.
                  sizes={lead && index === 0 ? "(min-width: 768px) 53vw, 100vw" : "(min-width: 768px) 53vw, 80vw"}
                  className="ease-standard object-cover transition-transform duration-300 group-hover/tile:scale-[1.02]"
                />
              ) : (
                <ProductInitial name={name} className="text-7xl md:text-8xl" />
              )}
            </span>
            <span className="text-lg underline-offset-4 group-hover/tile:underline">{name}</span>
          </Link>
        )
      })}
    </div>
  )
}
