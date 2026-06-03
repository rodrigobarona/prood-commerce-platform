import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import { listAllApiKeys } from "@/lib/admin-queries"

export const metadata = { title: "API Keys" }

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default async function ApiKeysPage() {
  let keys: Awaited<ReturnType<typeof listAllApiKeys>> = []
  try {
    keys = await listAllApiKeys()
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          All API keys across the platform ({keys.length}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Read-only overview of issued API keys.</CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Prefix</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Requests</th>
                    <th className="pb-3 pr-4 font-medium">Organization</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => {
                    const meta = parseMetadata(key.metadata)
                    const orgId =
                      meta && typeof meta.organizationId === "string"
                        ? meta.organizationId
                        : null

                    return (
                      <tr
                        key={key.id}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-3 pr-4 font-medium">
                          {key.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                          {key.start ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={key.enabled ? "outline" : "secondary"}
                          >
                            {key.enabled ? "active" : "disabled"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {key.requestCount}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                          {orgId ?? "—"}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {key.createdAt.toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No API keys issued.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
