import type { NextConfig } from "next"

import { mediaRemotePattern } from "@prood/media/remote-pattern"
import { securityHeaders } from "@prood/security-headers"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/ui", "@prood/media"],
  images: {
    // Product media lives in the R2 bucket, served at S3_PUBLIC_URL; brand
    // photography comes from @prood/media.
    remotePatterns: [
      mediaRemotePattern,
      ...(process.env.S3_PUBLIC_URL ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`)] : []),
    ],
  },
  headers: async () => securityHeaders({ noindex: true }),
}

export default nextConfig
