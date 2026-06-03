import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"

export const metadata = { title: "Settings" }

export default function SettingsPage() {
  const envVars = [
    { key: "NODE_ENV", value: process.env.NODE_ENV ?? "—" },
    {
      key: "BETTER_AUTH_URL",
      value: process.env.BETTER_AUTH_URL ? "(set)" : "(not set)",
    },
    {
      key: "API_PUBLIC_URL",
      value: process.env.API_PUBLIC_URL ? "(set)" : "(not set)",
    },
    {
      key: "DATABASE_URL",
      value: process.env.DATABASE_URL ? "(set)" : "(not set)",
    },
    {
      key: "ADMIN_USER_IDS",
      value: process.env.ADMIN_USER_IDS ?? "(not set)",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Platform configuration and environment status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
          <CardDescription>
            Key environment variable status (values are not exposed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {envVars.map((v) => (
              <div
                key={v.key}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <span className="font-mono text-sm">{v.key}</span>
                <span className="text-sm text-muted-foreground">{v.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            Users with the &ldquo;admin&rdquo; role can access this console.
            Set <code className="font-mono text-xs">ADMIN_USER_IDS</code> for
            ID-based bypass or use the Users page to assign the admin role.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
