import type { NextConfig } from "next"

import { securityHeaders } from "@prood/security-headers"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@prood/commerce"],
  // JSON only: no page here loads or runs anything.
  headers: async () => securityHeaders({ documents: false, noindex: true }),
}

export default nextConfig
