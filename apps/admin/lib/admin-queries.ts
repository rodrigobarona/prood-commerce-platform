import "server-only"
import { cache } from "react"
import { connection } from "next/server"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { count, eq, gt, gte, sql, desc, asc } from "drizzle-orm"
import * as schema from "@/lib/auth/schema"

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder"

const db = drizzle(neon(connectionString), { schema })

export interface PlatformStats {
  totalUsers: number
  newUsersLast30d: number
  activeSessions: number
  totalOrganizations: number
  totalApiKeys: number
}

export interface DailySignup {
  date: string
  count: number
}

export interface OrgByPlan {
  planId: string
  count: number
}

export interface ProviderDistribution {
  providerId: string
  count: number
}

export interface UserRow {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string
  banned: boolean | null
  banReason: string | null
  createdAt: Date
}

export interface OrgRow {
  id: string
  name: string
  slug: string
  logo: string | null
  planId: string
  planStatus: string
  memberCount: number
  createdAt: Date
}

export interface SessionRow {
  id: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
  impersonatedBy: string | null
}

export interface DomainRow {
  id: string
  domain: string
  organizationId: string
  orgName: string
  verified: boolean
  isPrimary: boolean
  createdAt: Date
}

export interface ApiKeyRow {
  id: string
  name: string | null
  start: string | null
  enabled: boolean
  referenceId: string
  requestCount: number
  lastRequest: Date | null
  createdAt: Date
  metadata: string | null
}

export interface AgentRow {
  id: string
  name: string
  status: string
  mode: string
  hostName: string | null
  userName: string | null
  lastUsedAt: Date | null
  createdAt: Date
}

export const getPlatformStats = cache(async function getPlatformStats(): Promise<PlatformStats> {
  await connection()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [users, newUsers, sessions, orgs, apiKeys] = await Promise.all([
    db.select({ value: count() }).from(schema.user),
    db
      .select({ value: count() })
      .from(schema.user)
      .where(gte(schema.user.createdAt, thirtyDaysAgo)),
    db
      .select({ value: count() })
      .from(schema.session)
      .where(gt(schema.session.expiresAt, new Date())),
    db.select({ value: count() }).from(schema.organization),
    db.select({ value: count() }).from(schema.apikey),
  ])

  return {
    totalUsers: users[0]?.value ?? 0,
    newUsersLast30d: newUsers[0]?.value ?? 0,
    activeSessions: sessions[0]?.value ?? 0,
    totalOrganizations: orgs[0]?.value ?? 0,
    totalApiKeys: apiKeys[0]?.value ?? 0,
  }
})

export const getDailySignups = cache(async function getDailySignups(): Promise<DailySignup[]> {
  await connection()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const rows = await db
    .select({
      date: sql<string>`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(schema.user)
    .where(gte(schema.user.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`))

  return rows
})

export const getOrgsByPlan = cache(async function getOrgsByPlan(): Promise<OrgByPlan[]> {
  await connection()
  const rows = await db
    .select({
      planId: schema.organization.planId,
      count: count(),
    })
    .from(schema.organization)
    .groupBy(schema.organization.planId)
    .orderBy(desc(count()))

  return rows
})

export const getProviderDistribution = cache(
  async function getProviderDistribution(): Promise<ProviderDistribution[]> {
    await connection()
    const rows = await db
      .select({
        providerId: schema.account.providerId,
        count: count(),
      })
      .from(schema.account)
      .groupBy(schema.account.providerId)
      .orderBy(desc(count()))

    return rows
  }
)

export const getRecentUsers = cache(async function getRecentUsers(
  limit = 10
): Promise<UserRow[]> {
  await connection()
  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      emailVerified: schema.user.emailVerified,
      image: schema.user.image,
      role: schema.user.role,
      banned: schema.user.banned,
      banReason: schema.user.banReason,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt))
    .limit(limit)

  return rows
})

export const listAllUsers = cache(async function listAllUsers(): Promise<UserRow[]> {
  await connection()
  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      emailVerified: schema.user.emailVerified,
      image: schema.user.image,
      role: schema.user.role,
      banned: schema.user.banned,
      banReason: schema.user.banReason,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt))

  return rows
})

export const getUserById = cache(async function getUserById(
  id: string
): Promise<UserRow | null> {
  await connection()
  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      emailVerified: schema.user.emailVerified,
      image: schema.user.image,
      role: schema.user.role,
      banned: schema.user.banned,
      banReason: schema.user.banReason,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, id))
    .limit(1)

  return rows[0] ?? null
})

export const getUserSessions = cache(async function getUserSessions(
  userId: string
): Promise<SessionRow[]> {
  await connection()
  const rows = await db
    .select({
      id: schema.session.id,
      userId: schema.session.userId,
      userName: schema.user.name,
      userEmail: schema.user.email,
      ipAddress: schema.session.ipAddress,
      userAgent: schema.session.userAgent,
      createdAt: schema.session.createdAt,
      expiresAt: schema.session.expiresAt,
      impersonatedBy: schema.session.impersonatedBy,
    })
    .from(schema.session)
    .innerJoin(schema.user, eq(schema.session.userId, schema.user.id))
    .where(eq(schema.session.userId, userId))
    .orderBy(desc(schema.session.createdAt))

  return rows
})

export const getUserOrganizations = cache(async function getUserOrganizations(
  userId: string
) {
  await connection()
  return db
    .select({
      orgId: schema.organization.id,
      orgName: schema.organization.name,
      orgSlug: schema.organization.slug,
      role: schema.member.role,
      joinedAt: schema.member.createdAt,
    })
    .from(schema.member)
    .innerJoin(
      schema.organization,
      eq(schema.member.organizationId, schema.organization.id)
    )
    .where(eq(schema.member.userId, userId))
    .orderBy(desc(schema.member.createdAt))
})

export const listAllOrganizations = cache(async function listAllOrganizations(): Promise<OrgRow[]> {
  await connection()
  const rows = await db
    .select({
      id: schema.organization.id,
      name: schema.organization.name,
      slug: schema.organization.slug,
      logo: schema.organization.logo,
      planId: schema.organization.planId,
      planStatus: schema.organization.planStatus,
      memberCount: count(schema.member.id),
      createdAt: schema.organization.createdAt,
    })
    .from(schema.organization)
    .leftJoin(
      schema.member,
      eq(schema.organization.id, schema.member.organizationId)
    )
    .groupBy(schema.organization.id)
    .orderBy(desc(schema.organization.createdAt))

  return rows
})

export const getOrganizationById = cache(async function getOrganizationById(
  id: string
) {
  await connection()
  const rows = await db
    .select({
      id: schema.organization.id,
      name: schema.organization.name,
      slug: schema.organization.slug,
      logo: schema.organization.logo,
      planId: schema.organization.planId,
      planStatus: schema.organization.planStatus,
      stripeCustomerId: schema.organization.stripeCustomerId,
      stripeSubscriptionId: schema.organization.stripeSubscriptionId,
      createdAt: schema.organization.createdAt,
    })
    .from(schema.organization)
    .where(eq(schema.organization.id, id))
    .limit(1)

  return rows[0] ?? null
})

export const getOrganizationMembers = cache(async function getOrganizationMembers(
  orgId: string
) {
  await connection()
  return db
    .select({
      memberId: schema.member.id,
      role: schema.member.role,
      joinedAt: schema.member.createdAt,
      userId: schema.user.id,
      userName: schema.user.name,
      userEmail: schema.user.email,
      userImage: schema.user.image,
    })
    .from(schema.member)
    .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
    .where(eq(schema.member.organizationId, orgId))
    .orderBy(desc(schema.member.createdAt))
})

export const getOrganizationDomains = cache(async function getOrganizationDomains(
  orgId: string
) {
  await connection()
  return db
    .select()
    .from(schema.tenantDomain)
    .where(eq(schema.tenantDomain.organizationId, orgId))
    .orderBy(desc(schema.tenantDomain.createdAt))
})

export const listAllSessions = cache(async function listAllSessions(): Promise<SessionRow[]> {
  await connection()
  return db
    .select({
      id: schema.session.id,
      userId: schema.session.userId,
      userName: schema.user.name,
      userEmail: schema.user.email,
      ipAddress: schema.session.ipAddress,
      userAgent: schema.session.userAgent,
      createdAt: schema.session.createdAt,
      expiresAt: schema.session.expiresAt,
      impersonatedBy: schema.session.impersonatedBy,
    })
    .from(schema.session)
    .innerJoin(schema.user, eq(schema.session.userId, schema.user.id))
    .where(gt(schema.session.expiresAt, new Date()))
    .orderBy(desc(schema.session.createdAt))
})

export const listAllDomains = cache(async function listAllDomains(): Promise<DomainRow[]> {
  await connection()
  return db
    .select({
      id: schema.tenantDomain.id,
      domain: schema.tenantDomain.domain,
      organizationId: schema.tenantDomain.organizationId,
      orgName: schema.organization.name,
      verified: schema.tenantDomain.verified,
      isPrimary: schema.tenantDomain.isPrimary,
      createdAt: schema.tenantDomain.createdAt,
    })
    .from(schema.tenantDomain)
    .innerJoin(
      schema.organization,
      eq(schema.tenantDomain.organizationId, schema.organization.id)
    )
    .orderBy(desc(schema.tenantDomain.createdAt))
})

export const listAllApiKeys = cache(async function listAllApiKeys(): Promise<ApiKeyRow[]> {
  await connection()
  return db
    .select({
      id: schema.apikey.id,
      name: schema.apikey.name,
      start: schema.apikey.start,
      enabled: schema.apikey.enabled,
      referenceId: schema.apikey.referenceId,
      requestCount: schema.apikey.requestCount,
      lastRequest: schema.apikey.lastRequest,
      createdAt: schema.apikey.createdAt,
      metadata: schema.apikey.metadata,
    })
    .from(schema.apikey)
    .orderBy(desc(schema.apikey.createdAt))
})

export const listAllAgents = cache(async function listAllAgents(): Promise<AgentRow[]> {
  await connection()
  return db
    .select({
      id: schema.agent.id,
      name: schema.agent.name,
      status: schema.agent.status,
      mode: schema.agent.mode,
      hostName: schema.agentHost.name,
      userName: schema.user.name,
      lastUsedAt: schema.agent.lastUsedAt,
      createdAt: schema.agent.createdAt,
    })
    .from(schema.agent)
    .leftJoin(schema.agentHost, eq(schema.agent.hostId, schema.agentHost.id))
    .leftJoin(schema.user, eq(schema.agent.userId, schema.user.id))
    .orderBy(desc(schema.agent.createdAt))
})

export async function deactivateAgent(id: string): Promise<void> {
  await connection()
  await db
    .update(schema.agent)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(schema.agent.id, id))
}
