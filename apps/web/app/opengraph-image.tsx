import { ImageResponse } from "next/og"

import { OgImage, ogImageSize } from "@prood/ui/brand/og-image"

export const alt = "Prood: open your store, keep the keys"
export const size = ogImageSize
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <OgImage
      title={["Open your store.", "Keep the keys."]}
      description="Your domain, your payment accounts and an open API. No cut of your sales."
      host="prood.com"
    />,
    size
  )
}
