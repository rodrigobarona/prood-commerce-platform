import Link from "next/link"
import { Key } from "@phosphor-icons/react/dist/ssr"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { Badge } from "@prood/ui/components/badge"
import { Button } from "@prood/ui/components/button"
import { listActiveOrgApiKeys } from "@/lib/api-keys"
import { ApiKeyCreateForm } from "./api-key-create-form"
import { revokeApiKeyAction } from "./actions"

export const metadata = { title: "API keys" }

export default async function ApiKeysPage() {
  const apiBase = process.env.COMMERCE_API_URL ?? "http://localhost:3005/v1"
  const keys = await listActiveOrgApiKeys()

  return (
    <DashboardFormPage>
      <div>
        <h2 className="font-heading text-xl font-medium">API keys</h2>
        <p className="text-sm text-muted-foreground">
          Machine and agent access to your store via the Commerce API.
        </p>
      </div>

      <div className="grid gap-6">
        <ApiKeyCreateForm />

        <div className="rounded-2xl border">
          <div className="flex items-center gap-3 border-b p-4">
            <Key className="size-5" />
            <div>
              <h3 className="font-medium">Organization API keys</h3>
              <p className="text-sm text-muted-foreground">
                Secrets are only shown once at creation time.
              </p>
            </div>
          </div>
          {keys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Prefix</th>
                    <th className="p-4 font-medium">Scopes</th>
                    <th className="p-4 font-medium">Requests</th>
                    <th className="p-4 font-medium">Last used</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="border-b last:border-0">
                      <td className="p-4 font-medium">{key.name ?? "Untitled key"}</td>
                      <td className="p-4 font-mono text-xs">{key.start ?? "pk"}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="secondary">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">{key.requestCount}</td>
                      <td className="p-4 text-muted-foreground">
                        {key.lastRequest?.toLocaleString() ?? "never"}
                      </td>
                      <td className="p-4">
                        <Badge variant={key.enabled ? "outline" : "secondary"}>
                          {key.enabled ? "enabled" : "revoked"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {key.enabled ? (
                          <form action={revokeApiKeyAction}>
                            <input name="id" type="hidden" value={key.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Revoke
                            </Button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No API keys created yet.
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 rounded-2xl border p-4 text-left text-sm">
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
        </div>
      </div>
    </DashboardFormPage>
  )
}
