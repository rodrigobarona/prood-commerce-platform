import { ImageResponse } from "next/og"

import { OgImage, ogImageSize } from "@prood/ui/brand/og-image"

export const alt = "Prood Admin"
export const size = ogImageSize
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <OgImage label="Admin" title="Platform operations." host="admin.prood.com" />,
    size
  )
}
