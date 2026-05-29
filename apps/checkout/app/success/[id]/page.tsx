import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ orderId?: string; returnUrl?: string }>
}) {
  const { id } = await params
  const { orderId, returnUrl } = await searchParams

  return (
    <div className="bg-background flex flex-col items-center gap-4 rounded-2xl border p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-green-600">Payment Successful</h2>
      <p className="text-muted-foreground text-sm">
        Session <span className="font-mono text-xs">{id}</span> has been completed.
      </p>
      {orderId ? (
        <p className="text-sm">
          Order ID: <span className="font-mono font-medium">{orderId}</span>
        </p>
      ) : null}
      {returnUrl ? (
        <Button asChild className="mt-2">
          <a href={returnUrl}>Return to store</a>
        </Button>
      ) : (
        <Button asChild variant="outline" className="mt-2">
          <Link href="/">Back</Link>
        </Button>
      )}
    </div>
  )
}
