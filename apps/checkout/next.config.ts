import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: [
    "@prood/ui",
    "@prood/types",
    "@prood/checkout-host",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
}

export default nextConfig
