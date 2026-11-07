import type { NextConfig } from "next"

import { mediaRemotePattern } from "@prood/media/remote-pattern"
import { securityHeaders } from "@prood/security-headers"

import { BASE_PATH } from "./lib/base-path"

const nextConfig: NextConfig = {
  // The app is served at prood.com/pay: the gateway rewrites /pay/:path* to this project unchanged.
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: [
    "@prood/ui",
    "@prood/types",
    "@prood/checkout-host",
    "@prood/media",
  ],
  images: {
    // Product media lives in the R2 bucket, served at S3_PUBLIC_URL; brand
    // photography comes from @prood/media.
    remotePatterns: [
      mediaRemotePattern,
      ...(process.env.S3_PUBLIC_URL ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/**`)] : []),
    ],
  },
  // Stripe.js and the Elements frames. The Permissions-Policy hands `payment` to
  // Stripe's frame so wallets (Apple Pay, Google Pay) can open.
  // The gateway only ever asks this project for paths under pay, so an address without it means
  // someone opened the project's own *.vercel.app address: send them to the real one.
  redirects: async () => {
    const home = process.env.CHECKOUT_URL
    return home
      ? [{ source: "/:path((?!pay(?:[./]|$)|_next/).*)", destination: `${home}/:path`, basePath: false as const, permanent: false }, { source: "/", destination: home, basePath: false as const, permanent: false }]
      : []
  },
  headers: async () =>
    securityHeaders({
      scriptSrc: ["https://js.stripe.com"],
      imgSrc: ["https://*.stripe.com"],
      connectSrc: ["https://api.stripe.com", "https://m.stripe.network"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com", "https://m.stripe.network"],
      paymentFrames: ["https://js.stripe.com"],
    }),
}

export default nextConfig
