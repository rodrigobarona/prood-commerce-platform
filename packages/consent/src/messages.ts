/**
 * Banner and dialog copy, written to match what each site actually does so it
 * replaces c15t's stock copy (which talks about personalised content and ads
 * Prood does not run). "Accept all" and "Reject all" carry equal weight on
 * purpose.
 *
 * The one optional category is `measurement`: Vercel Web Analytics. If a second
 * tool is ever added, update this copy, the privacy notice and the
 * sub-processor list in the same change.
 */
export type ConsentScope = "marketing" | "store"

const common = {
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  customize: "Choose",
  save: "Save choices",
  close: "Close",
}

const necessary = {
  title: "Necessary",
  description: "Needed for the site to work and to remember your choice. Always on.",
}

const measurementDescription =
  "Vercel Web Analytics counts page views, referring sites, and the country, browser and device type of visitors. It sets no cookie and is not used for advertising."

export function consentMessages(scope: ConsentScope) {
  const subject = scope === "store" ? "Prood, the platform that runs this store," : "We"
  const place = scope === "store" ? "this store" : "this website"
  return {
    common,
    cookieBanner: {
      title: "Your privacy choices",
      description: `${subject} use Vercel Web Analytics to count visits to ${place}. It loads only if you allow it. ${
        scope === "store" ? "The store" : "The site"
      } works the same either way, and you can change your choice at any time.`,
    },
    consentManagerDialog: {
      title: "Privacy choices",
      description: `Choose whether we may measure visits to ${place}. Your choice is kept for 12 months.`,
    },
    consentTypes: {
      necessary,
      measurement: { title: "Visit statistics", description: measurementDescription },
    },
  }
}
