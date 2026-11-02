import { notFound } from "next/navigation"
import { Container } from "@/components/layout/container"
import { DEMO_POLICIES } from "@/lib/demo-policies"
import { isDemoStore } from "@/lib/demo-store"
import { resolveTenantId } from "@/lib/tenant"

/** Only the demo has these: stores have no policy fields yet, and we won't write their legal text. */
async function findPolicy(params: Promise<{ slug: string }>) {
  const [{ slug }, tenantId] = await Promise.all([params, resolveTenantId()])
  return isDemoStore(tenantId) ? DEMO_POLICIES.find((policy) => policy.slug === slug) : undefined
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: (await findPolicy(params))?.title ?? "Page not found" }
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const policy = await findPolicy(params)
  if (!policy) notFound()

  return (
    <Container className="flex max-w-2xl! flex-col gap-4 py-12 md:py-16">
      <p className="text-muted-foreground text-sm">Example for a made-up store. Not a real policy.</p>
      <h1 className="text-display-sm">{policy.title}</h1>
      {policy.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-muted-foreground">
          {paragraph}
        </p>
      ))}
    </Container>
  )
}
