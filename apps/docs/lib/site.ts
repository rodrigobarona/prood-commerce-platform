import { publicUrl } from './shared';

/** Where the rest of Prood lives; each environment points these at its own deployment. */
const marketingUrl = publicUrl(process.env.NEXT_PUBLIC_WEB_URL, 'NEXT_PUBLIC_WEB_URL');
const dashboardUrl = publicUrl(process.env.NEXT_PUBLIC_DASHBOARD_URL, 'NEXT_PUBLIC_DASHBOARD_URL');
const apiUrl = publicUrl(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL');

export const site = {
  marketingUrl,
  /** The API's origin; `/v1`, `/mcp` and `/.well-known/agent-configuration` hang off it. */
  apiUrl,
  registerUrl: `${dashboardUrl}/register`,
  email: 'hello@prood.com',
} as const;

/** Top-level sections, in the header on every page. */
export const mainNav = [
  { label: 'Get started', href: '/docs/getting-started' },
  { label: 'Guides', href: '/docs/guides' },
  { label: 'API reference', href: '/docs/api' },
  { label: 'Plans', href: '/docs/billing/plans' },
] as const;
