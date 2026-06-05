export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-background p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold tracking-tight">Checkout</h1>
      <p className="text-muted-foreground text-sm">
        Customers are redirected here from the storefront or via payment links.
      </p>
    </div>
  )
}
