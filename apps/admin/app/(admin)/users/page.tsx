import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Badge } from "@prood/ui/components/badge"
import { listAllUsers } from "@/lib/admin-queries"

export const metadata = { title: "Users" }

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof listAllUsers>> = []
  try {
    users = await listAllUsers()
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Users</h2>
        <p className="text-sm text-muted-foreground">
          All registered users across the platform ({users.length}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Click a user to view details, manage sessions, or change roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 pr-4 font-medium">Verified</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium hover:underline"
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            user.emailVerified ? "outline" : "secondary"
                          }
                        >
                          {user.emailVerified ? "verified" : "unverified"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {user.banned ? (
                          <Badge variant="destructive">banned</Badge>
                        ) : (
                          <Badge variant="outline">active</Badge>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {user.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
