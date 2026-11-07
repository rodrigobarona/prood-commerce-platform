import { ImageResponse } from "next/og"

import { MarkImage } from "@prood/ui/brand/og-image"

// A route, not the `apple-icon` metadata file: Next.js links that file without the base path.
export function GET() {
  return new ImageResponse(<MarkImage />, { width: 180, height: 180 })
}
