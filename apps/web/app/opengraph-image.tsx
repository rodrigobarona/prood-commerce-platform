import { ImageResponse } from "next/og"

import { OgImage, ogImageSize } from "@prood/ui/brand/og-image"

export const alt = "Prood: commerce, ready to run"
export const size = ogImageSize
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <OgImage
      title={["Commerce, ready to run.", "Keep the keys."]}
      description="Your store, checkout and orders, hosted for you. Your domain and payment accounts."
      host="prood.com"
    />,
    size
  )
}
