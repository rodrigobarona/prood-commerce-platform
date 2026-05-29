import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

/** Browser auth client. Safe to import in Client Components. */
export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

export const { signIn, signUp, signOut, useSession, organization } = authClient
