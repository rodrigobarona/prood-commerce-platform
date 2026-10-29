import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/ui"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
}

export default nextConfig
