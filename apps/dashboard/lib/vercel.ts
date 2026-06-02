import "server-only"
import { VercelCore } from "@vercel/sdk/core.js"
import { projectsAddProjectDomain } from "@vercel/sdk/funcs/projectsAddProjectDomain.js"
import { projectsGetProjectDomain } from "@vercel/sdk/funcs/projectsGetProjectDomain.js"
import { projectsGetProjectDomains } from "@vercel/sdk/funcs/projectsGetProjectDomains.js"
import { projectsVerifyProjectDomain } from "@vercel/sdk/funcs/projectsVerifyProjectDomain.js"
import { projectsRemoveProjectDomain } from "@vercel/sdk/funcs/projectsRemoveProjectDomain.js"
import { VercelError } from "@vercel/sdk/models/vercelerror.js"
import {
  defaultDnsInstructions,
  mergeDnsInstructions,
  type DnsRecord,
} from "@/lib/dns-records"

export type { DnsRecord } from "@/lib/dns-records"

interface VercelConfig {
  token: string
  projectId: string
  teamId?: string
}

/** Read env at call time — module-level snapshots miss .env.local until restart. */
function getVercelConfig(): VercelConfig | null {
  const token = process.env.VERCEL_TOKEN?.trim()
  const projectId =
    process.env.STOREFRONT_VERCEL_PROJECT_ID?.trim() ??
    process.env.VERCEL_PROJECT_ID?.trim()
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  if (!token || !projectId) return null
  return { token, projectId, teamId: teamId || undefined }
}

/** Whether Vercel domain management is configured for this environment. */
export function isVercelConfigured(): boolean {
  return getVercelConfig() !== null
}

function client(config: VercelConfig): VercelCore {
  return new VercelCore({ bearerToken: config.token })
}

function projectRequest(config: VercelConfig) {
  return {
    idOrName: config.projectId,
    ...(config.teamId ? { teamId: config.teamId } : {}),
  }
}

function formatVercelError(error: unknown): Error {
  if (error instanceof VercelError) {
    const detail =
      typeof error.body === "object" && error.body && "error" in error.body
        ? String((error.body as { error?: { message?: string } }).error?.message ?? "")
        : ""
    const message = detail || error.message || "Unknown Vercel API error"
    return new Error(`Vercel API (${error.statusCode}): ${message}`)
  }
  if (error instanceof Error) return error
  return new Error("Vercel API request failed")
}

function isVercelNotFound(error: unknown): boolean {
  return error instanceof VercelError && error.statusCode === 404
}

export interface DomainVerification {
  verified: boolean
  instructions: DnsRecord[]
}

export interface VercelProvisioningStatus {
  configured: boolean
  projectIdPrefix: string | null
  linkedDomainCount: number
  sampleDomains: string[]
  /** Set when STOREFRONT_VERCEL_PROJECT_ID looks like the dashboard app, not storefront. */
  misconfiguredHint: string | null
}

function mapAddResponse(
  domain: string,
  value: {
    verified?: boolean
    verification?: { type: string; domain: string; value: string }[]
  }
): DomainVerification {
  return {
    verified: Boolean(value.verified),
    instructions: mergeDnsInstructions(domain, value.verification),
  }
}

/** Surface project linkage for the Domains page (no secrets). */
export async function getVercelProvisioningStatus(): Promise<VercelProvisioningStatus> {
  const config = getVercelConfig()
  if (!config) {
    return {
      configured: false,
      projectIdPrefix: null,
      linkedDomainCount: 0,
      sampleDomains: [],
      misconfiguredHint: null,
    }
  }

  const res = await projectsGetProjectDomains(client(config), projectRequest(config))
  if (!res.ok) {
    return {
      configured: true,
      projectIdPrefix: config.projectId.slice(0, 12),
      linkedDomainCount: 0,
      sampleDomains: [],
      misconfiguredHint: formatVercelError(res.error).message,
    }
  }

  const names =
    res.value.domains?.map((row) => row.name).filter(Boolean) ?? []

  const looksLikeDashboard = names.some((name) =>
    /(^|[.-])dashboard([.-]|$)/i.test(name)
  )

  return {
    configured: true,
    projectIdPrefix: config.projectId.slice(0, 12),
    linkedDomainCount: names.length,
    sampleDomains: names.slice(0, 4),
    misconfiguredHint: looksLikeDashboard
      ? "STOREFRONT_VERCEL_PROJECT_ID looks like the dashboard Vercel project (e.g. dashboard-prood.vercel.app). It must point to the storefront project so custom store domains attach to apps/storefront."
      : null,
  }
}

/**
 * Assign a domain to the storefront Vercel project.
 * When Vercel isn't configured, returns generic DNS hints only (DB row still allowed).
 */
export async function addProjectDomain(domain: string): Promise<DomainVerification> {
  const config = getVercelConfig()
  if (!config) {
    return {
      verified: false,
      instructions: defaultDnsInstructions(domain),
    }
  }

  const res = await projectsAddProjectDomain(client(config), {
    ...projectRequest(config),
    requestBody: { name: domain },
  })
  if (!res.ok) throw formatVercelError(res.error)

  return mapAddResponse(domain, res.value)
}

/** Ensure a domain exists on the configured Vercel project (idempotent). */
export async function ensureProjectDomain(domain: string): Promise<DomainVerification> {
  const config = getVercelConfig()
  if (!config) {
    return {
      verified: false,
      instructions: defaultDnsInstructions(domain),
    }
  }

  const existing = await projectsGetProjectDomain(client(config), {
    ...projectRequest(config),
    domain,
  })

  if (existing.ok) {
    return mapAddResponse(domain, existing.value)
  }

  if (!isVercelNotFound(existing.error)) {
    throw formatVercelError(existing.error)
  }

  return addProjectDomain(domain)
}

/** Fetch current DNS verification requirements for a project domain. */
export async function getProjectDomain(domain: string): Promise<DomainVerification> {
  const config = getVercelConfig()
  if (!config) {
    return {
      verified: false,
      instructions: defaultDnsInstructions(domain),
    }
  }

  const res = await projectsGetProjectDomain(client(config), {
    ...projectRequest(config),
    domain,
  })
  if (!res.ok) throw formatVercelError(res.error)

  return mapAddResponse(domain, res.value)
}

/** Check + trigger verification for a tenant domain on the Vercel project. */
export async function verifyProjectDomain(
  domain: string
): Promise<DomainVerification> {
  const config = getVercelConfig()
  if (!config) {
    return {
      verified: false,
      instructions: defaultDnsInstructions(domain),
    }
  }

  const res = await projectsVerifyProjectDomain(client(config), {
    ...projectRequest(config),
    domain,
  })
  if (!res.ok) throw formatVercelError(res.error)

  const value = res.value as {
    verified?: boolean
    verification?: { type: string; domain: string; value: string }[]
  }

  return {
    verified: Boolean(value.verified),
    instructions: mergeDnsInstructions(domain, value.verification),
  }
}

/** Remove a domain from the storefront Vercel project. */
export async function removeProjectDomain(domain: string): Promise<void> {
  const config = getVercelConfig()
  if (!config) return

  const res = await projectsRemoveProjectDomain(client(config), {
    ...projectRequest(config),
    domain,
  })
  if (!res.ok) throw formatVercelError(res.error)
}
