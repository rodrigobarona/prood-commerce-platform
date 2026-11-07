import { ImageResponse } from "next/og"

import { OgImage, ogImageSize } from "@prood/ui/brand/og-image"
import { docsHost } from "@/lib/shared"

export const alt = "Prood documentation"
export const size = ogImageSize
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    <OgImage
      label="Docs"
      title="Build on Prood."
      description="Guides, the REST API reference, MCP and Agent Auth."
      host={docsHost}
    />,
    size
  )
}
