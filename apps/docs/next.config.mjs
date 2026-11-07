/* global process */
import { createMDX } from 'fumadocs-mdx/next';
import { mediaRemotePattern } from '@prood/media/remote-pattern';
import { originOf, securityHeaders } from '@prood/security-headers';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@prood/ui', '@prood/media'],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
  headers: async () =>
    securityHeaders({
      // The API playground calls /v1 from the browser. Keep the default in step with lib/openapi.ts.
      connectSrc: [originOf(process.env.NEXT_PUBLIC_API_URL ?? 'https://api.prood.com')],
    }),
};

export default withMDX(config);
