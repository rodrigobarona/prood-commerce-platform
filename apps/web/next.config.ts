import { withConsentManifest } from "c15t/next/build"
import type { NextConfig } from "next"

import { mediaRemotePattern } from "@prood/media/remote-pattern"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/consent", "@prood/ui", "@prood/media"],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
}

// Bundles the INTH policy (see c15t.config.ts) into the build. If INTH
// can't be reached, the build still finishes and the server fetches the policy at
// runtime: until it resolves, the banner stays hidden and analytics stay off.
export default withConsentManifest(nextConfig, { onBuildError: "runtime" })
