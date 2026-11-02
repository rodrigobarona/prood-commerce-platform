import { isDemoStore } from "@/lib/demo-store"

export const DEMO_MESSAGE = "Demo store. Nothing here is for sale."

export function DemoNotice({ tenantId }: { tenantId: string }) {
  if (!isDemoStore(tenantId)) return null
  return (
    <aside aria-label="Demo store notice">
      <p className="bg-muted text-foreground px-5 py-2 text-center text-sm">{DEMO_MESSAGE}</p>
    </aside>
  )
}
