import type { NextConfig } from "next"

import { mediaRemotePattern } from "@prood/media/remote-pattern"
import { originOf, securityHeaders } from "@prood/security-headers"

/**
 * The dashboard is the root of prood.com once you're signed in: `/`, `/orders`, `/products`... The
 * gateway in apps/web sends those paths here (its next.config.ts has the list). Its scripts, styles
 * and images are asked for under `/_dashboard`, so they can't collide with the marketing site's own
 * /_next files, which the same domain serves.
 */
const nextConfig: NextConfig = {
  assetPrefix: "/_dashboard",
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/ui", "@prood/commerce", "@prood/media"],
  images: {
    path: "/_dashboard/_next/image",
    // Product media lives in the R2 bucket, served at S3_PUBLIC_URL; brand
    // photography comes from @prood/media.
    remotePatterns: [
      // The pattern comes from plain JS, which widens protocol to string.
      mediaRemotePattern,
      ...(process.env.S3_PUBLIC_URL ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`)] : []),
    ],
  },
  headers: async () =>
    securityHeaders({
      // Product thumbnails are `unoptimized`, so the browser loads them from the bucket itself.
      imgSrc: [originOf(process.env.S3_PUBLIC_URL)],
      noindex: true,
    }),
}

export default nextConfig
