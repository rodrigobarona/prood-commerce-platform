import { CheckoutFlow } from "@/components/checkout/checkout-flow"

export const metadata = { title: "Checkout" }

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Checkout</h1>
      <CheckoutFlow />
    </div>
  )
}
