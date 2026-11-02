import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { Logo } from "@prood/ui/components/logo"
import { PageHeader } from "@prood/ui/components/page-header"

export const metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-10 px-6 py-8">
      <Link href="/" aria-label="Prood, go to your dashboard" className="w-fit">
        <Logo className="h-7" title={null} />
      </Link>
      <PageHeader
        title="We couldn't find that page"
        description="The address may be wrong, or the page may have moved. Your dashboard is one click away."
        actions={
          <Button asChild>
            <Link href="/">Go to your dashboard</Link>
          </Button>
        }
      />
    </main>
  )
}
