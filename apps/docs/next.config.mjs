/* global process */
import { createMDX } from 'fumadocs-mdx/next';
import { mediaRemotePattern } from '@prood/media/remote-pattern';
import { originOf, securityHeaders } from '@prood/security-headers';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // One zone of prood.com: pages live under /docs, so the build's own files are
  // requested under /_docs/_next/... to stay clear of the other apps' /_next.
  // The gateway rewrites /_docs/_next/:path* to this project's /_next/:path*.
  assetPrefix: '/_docs',
  transpilePackages: ['@prood/ui', '@prood/media'],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
  headers: async () =>
    securityHeaders({
      // The API playground calls /v1 from the browser. In production the API shares this
      // origin, so 'self' covers it; locally it is another port (see lib/openapi.ts).
      connectSrc: [originOf(process.env.NEXT_PUBLIC_API_URL)],
    }),
};

export default withMDX(config);
