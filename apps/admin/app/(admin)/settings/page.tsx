import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import { PageStack as AdminPage } from "@prood/ui/components/page-layout"
import { assertAdmin } from "@/lib/auth"
import { settingStatus } from "@/lib/status"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  await assertAdmin()

  const requiredEnv = ["BETTER_AUTH_URL", "API_PUBLIC_URL", "DATABASE_URL"] as const

  return (
    <div className="max-w-2xl">
      <AdminPage>
        <PageHeader
          title="Settings"
          description="How this admin deployment is configured."
        />

        <Panel
          title="Environment"
          description="Whether each setting is present. Values are never shown."
        >
          <FactList>
            <Fact label={<span className="font-mono text-xs">NODE_ENV</span>}>
              <span className="font-mono text-xs">{process.env.NODE_ENV}</span>
            </Fact>
            {requiredEnv.map((key) => (
              <Fact key={key} label={<span className="font-mono text-xs">{key}</span>}>
                <Status look={settingStatus(Boolean(process.env[key]))} />
              </Fact>
            ))}
          </FactList>
        </Panel>

        <Panel
          title="Administrators"
          description="Anyone with the admin role can use this console."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Change someone&apos;s role from their user page.
            </p>
            <Button asChild variant="outline">
              <Link href="/users">View users</Link>
            </Button>
          </div>
        </Panel>
      </AdminPage>
    </div>
  )
}
