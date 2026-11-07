import { vercelAnalytics } from "@c15t/integrations/vercel-analytics"
import { defineConsentConfig } from "c15t/next"

/**
 * Cookie consent, hosted on INTH (project `prood.com`, Frankfurt).
 *
 * - Policy comes from the INTH project, bundled at build time. The runtime URL
 *   is public and the same in every environment, so it lives here, not in env.
 * - The browser talks to `/api/c15t` on this app's own origin. The route
 *   forwards saved choices to INTH, so visitors never contact inth.app.
 * - Web Analytics loads only after the visitor allows `measurement`.
 */
export default defineConsentConfig({
  backendURL: "https://prood-com-prood.inth.app",
  routePrefix: "/api/c15t",
  proxy: true,
  scripts: [vercelAnalytics()],
  options: {
    // Offer only what is used. No marketing, no embeds.
    consentCategories: ["necessary", "measurement"],
  },
})
