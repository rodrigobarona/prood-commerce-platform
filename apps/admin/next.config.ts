import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/ui"],
  images: {
    // Product media lives in the R2 bucket, served at S3_PUBLIC_URL; the demo
    // seed uses placehold.co PNGs.
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      ...(process.env.S3_PUBLIC_URL ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`)] : []),
    ],
  },
}

export default nextConfig
