import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"

export function NotFoundNotice() {
  return (
    <PageHeader
      title="We can't find that page"
      description="The record may have been deleted, or the link may be wrong. Check the address, or start again from the overview."
      actions={
        <Button asChild>
          <Link href="/">Go to overview</Link>
        </Button>
      }
    />
  )
}
