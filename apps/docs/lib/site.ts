/** Canonical origins; each environment can point these at its own deployment. */
const marketingUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? 'https://prood.com').replace(/\/$/, '');
const dashboardUrl = (process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://dashboard.prood.com').replace(
  /\/$/,
  '',
);

export const site = {
  marketingUrl,
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
