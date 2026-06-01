import { createAuthGetter, type Session, type SessionUser } from "@prood/auth/server"

/** Server-side auth for session validation (issuance is on apps/api). */
export const getAuth = createAuthGetter()

export type { Session, SessionUser }
