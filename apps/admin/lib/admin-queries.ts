import "server-only"
import { cache } from "react"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { and, count, eq, gt, gte, ilike, isNotNull, or, sql, desc, asc, type SQL } from "drizzle-orm"
import * as schema from "@prood/auth/schema"
import { agentOrganizationId, recordAgentEvent } from "@prood/auth/agent-events"
import { planIds, type PlanId } from "@prood/billing"
import { contains } from "@prood/types"
import { assertAdmin } from "@/lib/auth"

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder"

const db = drizzle(neon(connectionString), { schema })

/** One page of a list, with the size of the whole list. */
export interface ListPage<Row> {
  rows: Row[]
  total: number
}

interface PageOptions {
  q: string
  limit: number
  offset: number
}

/** Free, Grow, Scale, Agency everywhere. A plan this build doesn't know goes last. */
function planRank(planId: string): number {
  const rank = planIds.indexOf(planId as PlanId)
  return rank === -1 ? planIds.length : rank
}

export interface PlatformStats {
  totalUsers: number
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
  organizationId: string
  orgName: string | null
  requestCount: number
  lastRequest: Date | null
  createdAt: Date
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
  await assertAdmin()

  const [users, sessions, orgs, apiKeys] = await Promise.all([
    db.select({ value: count() }).from(schema.user),
    db
      .select({ value: count() })
      .from(schema.session)
      .where(gt(schema.session.expiresAt, new Date())),
    db.select({ value: count() }).from(schema.organization),
    db.select({ value: count() }).from(schema.apikey),
  ])

  return {
    totalUsers: users[0]?.value ?? 0,
    activeSessions: sessions[0]?.value ?? 0,
    totalOrganizations: orgs[0]?.value ?? 0,
    totalApiKeys: apiKeys[0]?.value ?? 0,
  }
})

export interface AttentionCounts {
  pastDueOrganizations: number
  pendingAgents: number
}

/** What's waiting on someone across every store. */
export const getAttentionCounts = cache(async function getAttentionCounts(): Promise<AttentionCounts> {
  await assertAdmin()
  const [orgs, agents] = await Promise.all([
    db.select({ value: count() }).from(schema.organization).where(eq(schema.organization.planStatus, "past_due")),
    db.select({ value: count() }).from(schema.agent).where(eq(schema.agent.status, "pending")),
  ])
  return {
    pastDueOrganizations: orgs[0]?.value ?? 0,
    pendingAgents: agents[0]?.value ?? 0,
  }
})

/** Signups by UTC day, over `days` days ending today. Every 30-day figure on the overview comes from this. */
export const getDailySignups = cache(async function getDailySignups(days: number): Promise<DailySignup[]> {
  await assertAdmin()
  const now = new Date()
  const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)))

  const rows = await db
    .select({
      date: sql<string>`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(schema.user)
    .where(gte(schema.user.createdAt, firstDay))
    .groupBy(sql`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(asc(sql`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`))

  return rows
})

export const getOrgsByPlan = cache(async function getOrgsByPlan(): Promise<OrgByPlan[]> {
  await assertAdmin()
  const rows = await db
    .select({
      planId: schema.organization.planId,
      count: count(),
    })
    .from(schema.organization)
    .groupBy(schema.organization.planId)

  return rows.sort((a, b) => planRank(a.planId) - planRank(b.planId))
})

export const getRecentUsers = cache(async function getRecentUsers(
  limit = 10
): Promise<UserRow[]> {
  await assertAdmin()
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

export type UserFilter = "admin" | "banned" | "unverified"
export type UserSort = "name" | "email" | "createdAt"

const USER_FILTERS: Record<UserFilter, SQL> = {
  admin: eq(schema.user.role, "admin"),
  banned: eq(schema.user.banned, true),
  unverified: eq(schema.user.emailVerified, false),
}

const USER_SORTS = {
  name: schema.user.name,
  email: schema.user.email,
  createdAt: schema.user.createdAt,
}

export async function listUsers(
  options: PageOptions & { filter?: UserFilter; sort: UserSort; dir: "asc" | "desc" }
): Promise<ListPage<UserRow>> {
  await assertAdmin()
  const where = and(
    options.filter ? USER_FILTERS[options.filter] : undefined,
    options.q
      ? or(ilike(schema.user.name, contains(options.q)), ilike(schema.user.email, contains(options.q)))
      : undefined
  )
  const order = options.dir === "asc" ? asc : desc

  const [rows, totals] = await Promise.all([
    db
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
      .where(where)
      .orderBy(order(USER_SORTS[options.sort]), desc(schema.user.id))
      .limit(options.limit)
      .offset(options.offset),
    db.select({ value: count() }).from(schema.user).where(where),
  ])

  return { rows, total: totals[0]?.value ?? 0 }
}

/** How many users each tab of the list holds. */
export async function getUserCounts(): Promise<Record<"all" | UserFilter, number>> {
  await assertAdmin()
  const [row] = await db
    .select({
      all: count(),
      admin: count(sql`CASE WHEN ${USER_FILTERS.admin} THEN 1 END`),
      banned: count(sql`CASE WHEN ${USER_FILTERS.banned} THEN 1 END`),
      unverified: count(sql`CASE WHEN ${USER_FILTERS.unverified} THEN 1 END`),
    })
    .from(schema.user)
  return {
    all: row?.all ?? 0,
    admin: row?.admin ?? 0,
    banned: row?.banned ?? 0,
    unverified: row?.unverified ?? 0,
  }
}

export const getUserById = cache(async function getUserById(
  id: string
): Promise<UserRow | null> {
  await assertAdmin()
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
  await assertAdmin()
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
  await assertAdmin()
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

export type OrgSort = "name" | "memberCount" | "createdAt"

export async function listOrganizations(
  options: PageOptions & { planId?: string; planStatus?: string; sort: OrgSort; dir: "asc" | "desc" }
): Promise<ListPage<OrgRow>> {
  await assertAdmin()
  const where = and(
    options.planId ? eq(schema.organization.planId, options.planId) : undefined,
    options.planStatus ? eq(schema.organization.planStatus, options.planStatus) : undefined,
    options.q
      ? or(
          ilike(schema.organization.name, contains(options.q)),
          ilike(schema.organization.slug, contains(options.q))
        )
      : undefined
  )
  const memberCount = count(schema.member.id)
  const sorts = {
    name: schema.organization.name,
    memberCount,
    createdAt: schema.organization.createdAt,
  }
  const order = options.dir === "asc" ? asc : desc

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: schema.organization.id,
        name: schema.organization.name,
        slug: schema.organization.slug,
        logo: schema.organization.logo,
        planId: schema.organization.planId,
        planStatus: schema.organization.planStatus,
        memberCount,
        createdAt: schema.organization.createdAt,
      })
      .from(schema.organization)
      .leftJoin(
        schema.member,
        eq(schema.organization.id, schema.member.organizationId)
      )
      .where(where)
      .groupBy(schema.organization.id)
      .orderBy(order(sorts[options.sort]), desc(schema.organization.id))
      .limit(options.limit)
      .offset(options.offset),
    db.select({ value: count() }).from(schema.organization).where(where),
  ])

  return { rows, total: totals[0]?.value ?? 0 }
}

export const getOrganizationById = cache(async function getOrganizationById(
  id: string
) {
  await assertAdmin()
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
  await assertAdmin()
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
  await assertAdmin()
  return db
    .select()
    .from(schema.tenantDomain)
    .where(eq(schema.tenantDomain.organizationId, orgId))
    .orderBy(desc(schema.tenantDomain.createdAt))
})

export type SessionSort = "createdAt" | "expiresAt"

export async function listSessions(
  options: PageOptions & { impersonated: boolean; userId?: string; sort: SessionSort; dir: "asc" | "desc" }
): Promise<ListPage<SessionRow>> {
  await assertAdmin()
  const where = and(
    gt(schema.session.expiresAt, new Date()),
    options.impersonated ? isNotNull(schema.session.impersonatedBy) : undefined,
    options.userId ? eq(schema.session.userId, options.userId) : undefined,
    options.q
      ? or(
          ilike(schema.user.name, contains(options.q)),
          ilike(schema.user.email, contains(options.q)),
          ilike(schema.session.ipAddress, contains(options.q))
        )
      : undefined
  )
  const sorts = { createdAt: schema.session.createdAt, expiresAt: schema.session.expiresAt }
  const order = options.dir === "asc" ? asc : desc

  const [rows, totals] = await Promise.all([
    db
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
      .where(where)
      .orderBy(order(sorts[options.sort]), desc(schema.session.id))
      .limit(options.limit)
      .offset(options.offset),
    db
      .select({ value: count() })
      .from(schema.session)
      .innerJoin(schema.user, eq(schema.session.userId, schema.user.id))
      .where(where),
  ])

  return { rows, total: totals[0]?.value ?? 0 }
}

/** How many live sessions each tab of the list holds. */
export async function getSessionCounts(): Promise<{ all: number; impersonated: number }> {
  await assertAdmin()
  const [row] = await db
    .select({
      all: count(),
      impersonated: count(schema.session.impersonatedBy),
    })
    .from(schema.session)
    .where(gt(schema.session.expiresAt, new Date()))
  return { all: row?.all ?? 0, impersonated: row?.impersonated ?? 0 }
}

/** The token a revocation needs. It stays on the server: pages only know a session's id. */
export async function getSessionToken(id: string): Promise<string | null> {
  await assertAdmin()
  const rows = await db
    .select({ token: schema.session.token })
    .from(schema.session)
    .where(eq(schema.session.id, id))
    .limit(1)
  return rows[0]?.token ?? null
}

export type DomainFilter = "verified" | "pending"

const DOMAIN_FILTERS: Record<DomainFilter, SQL> = {
  verified: eq(schema.tenantDomain.verified, true),
  pending: eq(schema.tenantDomain.verified, false),
}

export async function listDomains(
  options: PageOptions & { filter?: DomainFilter; dir: "asc" | "desc" }
): Promise<ListPage<DomainRow>> {
  await assertAdmin()
  const where = and(
    options.filter ? DOMAIN_FILTERS[options.filter] : undefined,
    options.q
      ? or(
          ilike(schema.tenantDomain.domain, contains(options.q)),
          ilike(schema.organization.name, contains(options.q))
        )
      : undefined
  )
  const order = options.dir === "asc" ? asc : desc

  const [rows, totals] = await Promise.all([
    db
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
      .innerJoin(schema.organization, eq(schema.tenantDomain.organizationId, schema.organization.id))
      .where(where)
      .orderBy(order(schema.tenantDomain.createdAt), desc(schema.tenantDomain.id))
      .limit(options.limit)
      .offset(options.offset),
    db
      .select({ value: count() })
      .from(schema.tenantDomain)
      .innerJoin(schema.organization, eq(schema.tenantDomain.organizationId, schema.organization.id))
      .where(where),
  ])

  return { rows, total: totals[0]?.value ?? 0 }
}

/** How many domains each tab of the list holds. */
export async function getDomainCounts(): Promise<Record<"all" | DomainFilter, number>> {
  await assertAdmin()
  const [row] = await db
    .select({
      all: count(),
      verified: count(sql`CASE WHEN ${DOMAIN_FILTERS.verified} THEN 1 END`),
      pending: count(sql`CASE WHEN ${DOMAIN_FILTERS.pending} THEN 1 END`),
    })
    .from(schema.tenantDomain)
  return { all: row?.all ?? 0, verified: row?.verified ?? 0, pending: row?.pending ?? 0 }
}

export type ApiKeyFilter = "active" | "revoked"
export type ApiKeySort = "createdAt" | "requestCount"

const API_KEY_FILTERS: Record<ApiKeyFilter, SQL> = {
  active: eq(schema.apikey.enabled, true),
  revoked: eq(schema.apikey.enabled, false),
}

export async function listApiKeys(
  options: PageOptions & { filter?: ApiKeyFilter; sort: ApiKeySort; dir: "asc" | "desc" }
): Promise<ListPage<ApiKeyRow>> {
  await assertAdmin()
  const where = and(
    options.filter ? API_KEY_FILTERS[options.filter] : undefined,
    options.q
      ? or(
          ilike(schema.apikey.name, contains(options.q)),
          ilike(schema.apikey.start, contains(options.q)),
          ilike(schema.organization.name, contains(options.q))
        )
      : undefined
  )
  const sorts = { createdAt: schema.apikey.createdAt, requestCount: schema.apikey.requestCount }
  const order = options.dir === "asc" ? asc : desc

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: schema.apikey.id,
        name: schema.apikey.name,
        start: schema.apikey.start,
        enabled: schema.apikey.enabled,
        organizationId: schema.apikey.referenceId,
        orgName: schema.organization.name,
        requestCount: schema.apikey.requestCount,
        lastRequest: schema.apikey.lastRequest,
        createdAt: schema.apikey.createdAt,
      })
      .from(schema.apikey)
      // A key's owner is `referenceId`: metadata is client-supplied and only carries scopes.
      .leftJoin(schema.organization, eq(schema.apikey.referenceId, schema.organization.id))
      .where(where)
      .orderBy(order(sorts[options.sort]), desc(schema.apikey.id))
      .limit(options.limit)
      .offset(options.offset),
    db
      .select({ value: count() })
      .from(schema.apikey)
      .leftJoin(schema.organization, eq(schema.apikey.referenceId, schema.organization.id))
      .where(where),
  ])

  return { rows, total: totals[0]?.value ?? 0 }
}

/** How many keys each tab of the list holds. */
export async function getApiKeyCounts(): Promise<Record<"all" | ApiKeyFilter, number>> {
  await assertAdmin()
  const [row] = await db
    .select({
      all: count(),
      active: count(sql`CASE WHEN ${API_KEY_FILTERS.active} THEN 1 END`),
      revoked: count(sql`CASE WHEN ${API_KEY_FILTERS.revoked} THEN 1 END`),
    })
    .from(schema.apikey)
  return { all: row?.all ?? 0, active: row?.active ?? 0, revoked: row?.revoked ?? 0 }
}

export const AGENT_FILTERS = ["active", "pending", "inactive", "expired", "revoked", "rejected"] as const
export type AgentFilter = (typeof AGENT_FILTERS)[number]
export type AgentSort = "createdAt" | "name"

export async function listAgents(
  options: PageOptions & { filter?: AgentFilter; sort: AgentSort; dir: "asc" | "desc" }
): Promise<ListPage<AgentRow>> {
  await assertAdmin()
  const where = and(
    options.filter ? eq(schema.agent.status, options.filter) : undefined,
    options.q
      ? or(
          ilike(schema.agent.name, contains(options.q)),
          ilike(schema.agentHost.name, contains(options.q)),
          ilike(schema.user.name, contains(options.q))
        )
      : undefined
  )
  const sorts = { createdAt: schema.agent.createdAt, name: schema.agent.name }
  const order = options.dir === "asc" ? asc : desc

  const [rows, totals] = await Promise.all([
    db
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
      .where(where)
      .orderBy(order(sorts[options.sort]), desc(schema.agent.id))
      .limit(options.limit)
      .offset(options.offset),
    db
      .select({ value: count() })
      .from(schema.agent)
      .leftJoin(schema.agentHost, eq(schema.agent.hostId, schema.agentHost.id))
      .leftJoin(schema.user, eq(schema.agent.userId, schema.user.id))
      .where(where),
  ])

  return { rows, total: totals[0]?.value ?? 0 }
}

/** How many agents each tab of the list holds, by status. */
export async function getAgentCounts(): Promise<{ all: number; byStatus: Record<string, number> }> {
  await assertAdmin()
  const rows = await db
    .select({ status: schema.agent.status, value: count() })
    .from(schema.agent)
    .groupBy(schema.agent.status)
  return {
    all: rows.reduce((sum, row) => sum + row.value, 0),
    byStatus: Object.fromEntries(rows.map((row) => [row.status, row.value])),
  }
}

/**
 * Ends an agent for good. `revoked` is the status Agent Auth refuses on every
 * call: any word it doesn't know, it lets through.
 */
export async function revokeAgent(id: string): Promise<void> {
  const session = await assertAdmin()
  const [target] = await db
    .select({ metadata: schema.agent.metadata, hostId: schema.agent.hostId })
    .from(schema.agent)
    .where(eq(schema.agent.id, id))
    .limit(1)
  const now = new Date()
  await db.batch([
    db.update(schema.agent).set({ status: "revoked", updatedAt: now }).where(eq(schema.agent.id, id)),
    db
      .update(schema.agentCapabilityGrant)
      .set({ status: "revoked", updatedAt: now })
      .where(and(eq(schema.agentCapabilityGrant.agentId, id), eq(schema.agentCapabilityGrant.status, "active"))),
  ])
  await recordAgentEvent({
    type: "agent.revoked",
    organizationId: agentOrganizationId(target?.metadata ?? null),
    agentId: id,
    hostId: target?.hostId,
    actorId: session.user.id,
    actorType: "user",
    metadata: { by: "platform-admin" },
  })
}
