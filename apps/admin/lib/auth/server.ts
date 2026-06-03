import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { authDb } from "@prood/auth/db"
import * as schema from "@prood/auth/schema"
import { session as sessionTable, user as userTable } from "@prood/auth/schema"
import { resolveBetterAuthEnv } from "@prood/auth/server"
import { eq, and, gt } from "drizzle-orm"

// ---------------------------------------------------------------------------
// Better Auth instance — used for admin write operations (ban, setRole, etc.)
// NOT used for session validation (see validateSessionToken below).
// ---------------------------------------------------------------------------

function createAdminAuth() {
  const { baseURL, secret } = resolveBetterAuthEnv("http://localhost:3005")
  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    baseURL,
    secret,
    plugins: [
      organization(),
      apiKey(),
      admin({ defaultRole: "user" }),
    ],
  })
}

let authInstance: ReturnType<typeof createAdminAuth> | null = null

export function getAuth() {
  return (authInstance ??= createAdminAuth())
}

// ---------------------------------------------------------------------------
// Direct DB session validation
//
// Better Auth's api.getSession() performs origin checks that reject requests
// from the admin proxy (localhost:3006 vs baseURL localhost:3005).  Since the
// admin only validates sessions (issuance is on apps/api), we read the token
// directly from the shared Neon database instead.
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  user: SessionUser
  session: {
    id: string
    token: string
    userId: string
    expiresAt: Date
    activeOrganizationId: string | null
  }
}

export async function validateSessionToken(token: string): Promise<Session | null> {
  const rows = await authDb
    .select({
      sessionId: sessionTable.id,
      sessionToken: sessionTable.token,
      sessionExpiresAt: sessionTable.expiresAt,
      sessionUserId: sessionTable.userId,
      sessionActiveOrgId: sessionTable.activeOrganizationId,
      userId: userTable.id,
      userName: userTable.name,
      userEmail: userTable.email,
      userEmailVerified: userTable.emailVerified,
      userImage: userTable.image,
      userRole: userTable.role,
      userCreatedAt: userTable.createdAt,
      userUpdatedAt: userTable.updatedAt,
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(
      and(
        eq(sessionTable.token, token),
        gt(sessionTable.expiresAt, new Date()),
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null
  return {
    user: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
      emailVerified: row.userEmailVerified,
      image: row.userImage,
      role: row.userRole,
      createdAt: row.userCreatedAt,
      updatedAt: row.userUpdatedAt,
    },
    session: {
      id: row.sessionId,
      token: row.sessionToken,
      userId: row.sessionUserId,
      expiresAt: row.sessionExpiresAt,
      activeOrganizationId: row.sessionActiveOrgId,
    },
  }
}
