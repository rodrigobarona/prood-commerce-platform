import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  transpilePackages: [
    "@workspace/ui",
    "@workspace/commerce",
    "@workspace/checkout-host",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
}

export default nextConfig
