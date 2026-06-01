import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { resolveAuthClientBaseUrl } from "@prood/auth/client"

/** Browser auth client — dashboard calls apps/api for all auth routes. */
export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(),
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})
