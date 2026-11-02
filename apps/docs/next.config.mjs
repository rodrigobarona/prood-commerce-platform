import { createMDX } from 'fumadocs-mdx/next';
import { mediaRemotePattern } from '@prood/media/remote-pattern';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@prood/ui', '@prood/media'],
  images: {
    remotePatterns: [mediaRemotePattern],
  },
};

export default withMDX(config);
