import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import { listAllSessions } from "@/lib/admin-queries"

export const metadata = { title: "Sessions" }

function shortenUA(ua: string | null): string {
  if (!ua) return "—"
  if (ua.length <= 60) return ua
  return `${ua.slice(0, 57)}...`
}

export default async function SessionsPage() {
  let sessions: Awaited<ReturnType<typeof listAllSessions>> = []
  try {
    sessions = await listAllSessions()
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Active Sessions</h2>
        <p className="text-sm text-muted-foreground">
          All currently active sessions across the platform (
          {sessions.length}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Sessions with a future expiry date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">User</th>
                    <th className="pb-3 pr-4 font-medium">IP Address</th>
                    <th className="pb-3 pr-4 font-medium">User Agent</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 pr-4 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Impersonated</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/users/${s.userId}`}
                          className="font-medium hover:underline"
                        >
                          {s.userName}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {s.userEmail}
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {s.ipAddress ?? "—"}
                      </td>
                      <td
                        className="max-w-[200px] truncate py-3 pr-4 text-xs text-muted-foreground"
                        title={s.userAgent ?? undefined}
                      >
                        {shortenUA(s.userAgent)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {s.createdAt.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {s.expiresAt.toLocaleString()}
                      </td>
                      <td className="py-3">
                        {s.impersonatedBy ? (
                          <Badge variant="secondary">yes</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active sessions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
