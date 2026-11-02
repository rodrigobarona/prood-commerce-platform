import Image, { type ImageProps } from "next/image"

import { FULL_BLEED_SIZES, getImage } from "./index"

type MediaImageProps = Omit<ImageProps, "src" | "alt" | "width" | "height" | "placeholder" | "blurDataURL"> & {
  slug: string
  /** Decorative images render with an empty alt so screen readers skip them. */
  decorative?: boolean
}

/** Curated library image: blur placeholder, intrinsic size and written alt text. */
export function MediaImage({ slug, decorative = false, fill, sizes, ...props }: MediaImageProps) {
  const image = getImage(slug)
  const common = {
    src: image.url,
    alt: decorative ? "" : image.alt,
    placeholder: "blur" as const,
    blurDataURL: image.blurDataURL,
    sizes: sizes ?? (fill ? FULL_BLEED_SIZES : undefined),
    ...props,
  }
  return fill ? <Image {...common} fill /> : <Image {...common} width={image.width} height={image.height} />
}
