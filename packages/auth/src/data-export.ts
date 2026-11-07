import { eq } from "drizzle-orm"
import { authDb } from "./db"
import { account, agent, invitation, member, organization, session, user } from "./schema"

/**
 * Everything the sign-in system holds about one person: Art. 15 and Art. 20
 * GDPR. Password hashes, session tokens and provider tokens are left out.
 * A shopper's orders and delivery details are the store's data, so they are
 * not here: the store is the one to ask.
 */
export async function exportAccountData(userId: string) {
  const [profile] = await authDb
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId))
  if (!profile) return null

  const [signInMethods, sessions, memberships, invitationsSent, invitationsToYou, agents] = await Promise.all([
    authDb
      .select({ provider: account.providerId, createdAt: account.createdAt })
      .from(account)
      .where(eq(account.userId, userId)),
    authDb
      .select({
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.userId, userId)),
    authDb
      .select({
        store: organization.name,
        address: organization.slug,
        role: member.role,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId)),
    authDb
      .select({
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(eq(invitation.inviterId, userId)),
    authDb
      .select({
        store: organization.name,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .innerJoin(organization, eq(invitation.organizationId, organization.id))
      .where(eq(invitation.email, profile.email)),
    authDb
      .select({
        name: agent.name,
        status: agent.status,
        mode: agent.mode,
        createdAt: agent.createdAt,
        lastUsedAt: agent.lastUsedAt,
      })
      .from(agent)
      .where(eq(agent.userId, userId)),
  ])

  return { profile, signInMethods, sessions, memberships, invitationsSent, invitationsToYou, agents }
}
