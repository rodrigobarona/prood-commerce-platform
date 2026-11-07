import { ConsentBanner, ConsentDialog, ConsentRoot, ConsentTheme } from "c15t/next"
import type { ReactNode } from "react"

import { type ConsentScope, consentMessages } from "./messages"
import { consentTheme } from "./theme"

/**
 * Mounts the consent provider. No `state`: the browser resolves consent after
 * hydration through `/api/c15t`, so every page stays static and edge-cached.
 * Scripts that need consent are listed in each app's `c15t.config.ts`.
 */
export function ConsentShell({
  scope,
  privacyHref,
  children,
}: {
  scope: ConsentScope
  /** The privacy notice the banner links to. Absolute for stores, which are on other hosts. */
  privacyHref: string
  children: ReactNode
}) {
  return (
    <>
      <ConsentTheme theme={consentTheme} />
      <ConsentRoot
        options={{
          i18n: { locale: "en", messages: { en: consentMessages(scope) } },
          legalLinks: { privacyPolicy: { href: privacyHref, label: "Privacy policy" } },
        }}
      >
        {children}
        <ConsentBanner />
        <ConsentDialog />
      </ConsentRoot>
    </>
  )
}
