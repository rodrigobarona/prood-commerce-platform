import type { NextConfig } from "next"

import { BASE_PATH } from "./lib/base-path"
import { mediaRemotePattern } from "@prood/media/remote-pattern"
import { originOf, securityHeaders } from "@prood/security-headers"

const nextConfig: NextConfig = {
  // The gateway on prood.com sends this prefix here; see lib/base-path.ts.
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/ui", "@prood/commerce", "@prood/media"],
  images: {
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
