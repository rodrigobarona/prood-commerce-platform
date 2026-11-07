import type { NextConfig } from "next"

import { BASE_PATH } from "./lib/base-path"
import { mediaRemotePattern } from "@prood/media/remote-pattern"
import { securityHeaders } from "@prood/security-headers"

const nextConfig: NextConfig = {
  // The gateway on prood.com sends this prefix here; see lib/base-path.ts.
  basePath: BASE_PATH,
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
  // The gateway only ever asks this project for paths under admin, so an address without it means
  // someone opened the project's own *.vercel.app address: send them to the real one.
  redirects: async () => {
    const home = process.env.NEXT_PUBLIC_ADMIN_URL
    return home
      ? [{ source: "/:path((?!admin(?:[./]|$)|_next/).*)", destination: `${home}/:path`, basePath: false as const, permanent: false }, { source: "/", destination: home, basePath: false as const, permanent: false }]
      : []
  },
  headers: async () => securityHeaders({ noindex: true }),
}

export default nextConfig
