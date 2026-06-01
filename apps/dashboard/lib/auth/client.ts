import { organizationClient } from "better-auth/client/plugins"
import { createAppAuthClient } from "@prood/auth/client"

export const authClient = createAppAuthClient({
  plugins: [organizationClient()],
})

export const { signIn, signUp, signOut, useSession, organization } = authClient
