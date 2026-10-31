import { ImageResponse } from "next/og"

import { OgImage, ogImageSize } from "@prood/ui/brand/og-image"

export const alt = "Prood Dashboard"
export const size = ogImageSize
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <OgImage
      label="Dashboard"
      title="Run your store from one place."
      description="Products, orders, customers, payments, domains and team."
      host="dashboard.prood.com"
    />,
    size
  )
}
