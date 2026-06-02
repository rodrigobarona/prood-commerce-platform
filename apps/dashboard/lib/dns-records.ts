export interface DnsRecord {
  type: string
  host: string
  value: string
}

/** Map Vercel verification challenges to dashboard DNS rows. */
export function fromVercelVerification(
  records: { type: string; domain: string; value: string }[] | undefined
): DnsRecord[] {
  if (!records?.length) return []
  return records.map((record) => ({
    type: record.type.toUpperCase(),
    host: record.domain,
    value: record.value,
  }))
}

/** Routing + verification records merchants need when Vercel returns none (local dev). */
export function defaultDnsInstructions(domain: string): DnsRecord[] {
  const labels = domain.split(".")
  const isSubdomain = labels.length > 2

  if (isSubdomain) {
    return [
      {
        type: "CNAME",
        host: domain,
        value: "cname.vercel-dns.com",
      },
    ]
  }

  return [
    {
      type: "A",
      host: "@",
      value: "76.76.21.21",
    },
  ]
}

/** Ensure pending domains always show routing + any Vercel verification TXT/CNAME rows. */
export function mergeDnsInstructions(
  domain: string,
  verification: { type: string; domain: string; value: string }[] | undefined
): DnsRecord[] {
  const fromVercel = fromVercelVerification(verification)
  const routing = defaultDnsInstructions(domain)

  const merged = [...routing]
  for (const record of fromVercel) {
    const duplicate = merged.some(
      (existing) =>
        existing.type === record.type &&
        existing.host === record.host &&
        existing.value === record.value
    )
    if (!duplicate) merged.push(record)
  }
  return merged
}
