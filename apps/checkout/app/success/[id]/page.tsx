import { Button } from "@prood/ui/components/button"

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
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-background p-6 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold">Payment Successful</h2>
      <p className="text-muted-foreground text-sm">
        Your order has been confirmed.
      </p>
      {orderId ? (
        <p className="text-sm">
          Order: <span className="font-mono font-medium">{orderId}</span>
        </p>
      ) : null}
      {returnUrl ? (
        <Button asChild className="mt-2">
          <a href={returnUrl}>Return to store</a>
        </Button>
      ) : (
        <p className="text-muted-foreground mt-2 text-xs">
          Session <span className="font-mono">{id}</span>
        </p>
      )}
    </div>
  )
}
