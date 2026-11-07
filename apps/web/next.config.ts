import { withConsentManifest } from "c15t/next/build"
import type { NextConfig } from "next"

import { MEDIA_URL, mediaRemotePattern } from "@prood/media/remote-pattern"
import { originOf, securityHeaders } from "@prood/security-headers"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/consent", "@prood/ui", "@prood/media"],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
  headers: async () =>
    securityHeaders({
      // Web Analytics, once the visitor allows `measurement`; its events post to /_vercel/insights.
      scriptSrc: ["https://va.vercel-scripts.com"],
      // The hero film plays straight from the media Worker.
      mediaSrc: [originOf(MEDIA_URL)],
    }),
}

// Bundles the INTH policy (see c15t.config.ts) into the build. If INTH
// can't be reached, the build still finishes and the server fetches the policy at
// runtime: until it resolves, the banner stays hidden and analytics stay off.
export default withConsentManifest(nextConfig, { onBuildError: "runtime" })
