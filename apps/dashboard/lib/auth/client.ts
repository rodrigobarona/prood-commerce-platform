import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { resolveAuthClientBaseUrl } from "@prood/auth/client"

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(),
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
export const organization = authClient.organization
