import { withConsentManifest } from "c15t/next/build"
import type { NextConfig } from "next"

import { mediaRemotePattern } from "@prood/media/remote-pattern"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The root layout sits under `[host]`, so unmatched paths need their own 404 page.
  experimental: { globalNotFound: true },
  transpilePackages: ["@prood/consent", "@prood/ui", "@prood/types", "@prood/media"],
  images: {
    // Product media lives in the R2 bucket, served at S3_PUBLIC_URL; brand
    // photography comes from @prood/media.
    remotePatterns: [
      mediaRemotePattern,
      ...(process.env.S3_PUBLIC_URL ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`)] : []),
    ],
  },
}

// Bundles the INTH policy (see c15t.config.ts) into the build. If INTH
// can't be reached, the build still finishes and the server fetches the policy at
// runtime: until it resolves, the banner stays hidden and analytics stay off.
export default withConsentManifest(nextConfig, { onBuildError: "runtime" })
