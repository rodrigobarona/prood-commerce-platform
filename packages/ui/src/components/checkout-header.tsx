interface CheckoutHeaderProps {
  storeName?: string
  homeHref?: string
}

export function CheckoutHeader({
  storeName = "Checkout",
  homeHref = "/",
}: CheckoutHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <a
          href={homeHref}
          className="text-lg font-semibold tracking-tight transition-colors hover:text-primary"
        >
          {storeName}
        </a>
      </div>
    </header>
  )
}
