import type { NextConfig } from "next"

import { mediaRemotePattern } from "@prood/media/remote-pattern"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/ui", "@prood/media"],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
}

export default nextConfig
