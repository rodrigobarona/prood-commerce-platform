/** Plain JS so next.config files can import it without a TypeScript loader. */
export const MEDIA_URL = "https://prood-media.rbarona.workers.dev"

/** @type {{ protocol: "https", hostname: string, pathname: string }} */
export const mediaRemotePattern = {
  protocol: "https",
  hostname: new URL(MEDIA_URL).hostname,
  pathname: "/brand/**",
}
