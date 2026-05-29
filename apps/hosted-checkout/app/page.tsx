import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Hosted Checkout</h1>
      <p className="text-muted-foreground text-sm">
        This is the hosted checkout service. Customers are redirected here from
        the storefront or via payment links.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back</Link>
      </Button>
    </div>
  )
}
