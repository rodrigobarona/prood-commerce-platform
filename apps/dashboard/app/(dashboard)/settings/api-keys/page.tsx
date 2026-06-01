import Link from "next/link"
import { Key } from "@phosphor-icons/react/dist/ssr"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { DashboardEmpty } from "@/components/dashboard-empty"

export const metadata = { title: "API keys" }

export default function ApiKeysPage() {
  const apiBase = process.env.COMMERCE_API_URL ?? "http://localhost:3005/v1"

  return (
    <DashboardFormPage>
      <div>
        <h2 className="font-heading text-xl font-medium">API keys</h2>
        <p className="text-sm text-muted-foreground">
          Machine and agent access to your store via the Commerce API.
        </p>
      </div>

      <DashboardEmpty
        icon={Key}
        title="API key management"
        description="Create and manage organization-scoped keys for machine and agent access."
        contentClassName="max-w-2xl items-stretch text-left"
      >
        <div className="flex w-full flex-col gap-3 text-left text-sm">
          <p>
            Keys are verified by the API app and must include JSON metadata:
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
              {`{ "organizationId": "<your-org-id>", "scopes": ["storefront", "admin"] }`}
            </code>
          </p>
          <p>
            Send the secret as{" "}
            <code className="rounded bg-muted px-1 py-0.5">x-api-key</code> on
            requests to{" "}
            <code className="rounded bg-muted px-1 py-0.5">{apiBase}</code>.
          </p>
          <p>
            Interactive reference:{" "}
            <Link href="http://localhost:3003/docs/api" className="underline">
              docs / Commerce API
            </Link>
            . Agent Auth discovery:{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              /.well-known/agent-configuration
            </code>
            .
          </p>
          <p className="text-muted-foreground">
            In-dashboard key creation is coming soon. Use Better Auth&apos;s API
            key plugin against the shared database until then.
          </p>
        </div>
      </DashboardEmpty>
    </DashboardFormPage>
  )
}
