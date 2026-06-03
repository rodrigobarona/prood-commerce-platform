import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import { listAllAgents } from "@/lib/admin-queries"

export const metadata = { title: "Agents" }

export default async function AgentsPage() {
  let agents: Awaited<ReturnType<typeof listAllAgents>> = []
  try {
    agents = await listAllAgents()
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Agents</h2>
        <p className="text-sm text-muted-foreground">
          Registered Agent Auth agents ({agents.length}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>Read-only overview of Agent Auth registrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Mode</th>
                    <th className="pb-3 pr-4 font-medium">Host</th>
                    <th className="pb-3 pr-4 font-medium">User</th>
                    <th className="pb-3 pr-4 font-medium">Last Used</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4 font-medium">{agent.name}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            agent.status === "active" ? "outline" : "secondary"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{agent.mode}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {agent.hostName ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {agent.userName ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {agent.lastUsedAt?.toLocaleString() ?? "never"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {agent.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No agents registered.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
