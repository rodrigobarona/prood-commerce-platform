import type { ReactNode } from "react"
import type { OrderPaymentState } from "@prood/types"

interface OrderStatusContext {
  couldNotOpenPayment: boolean
  orderNumber: string
  contactEmail: string | null
}

interface OrderStatusCopy {
  settled: boolean
  title: string
  detail: ReactNode
}

function ContactStore({ orderNumber, contactEmail }: Omit<OrderStatusContext, "couldNotOpenPayment">) {
  if (!contactEmail) return "Contact the store"
  const subject = encodeURIComponent(`Order #${orderNumber}`)
  return (
    <>
      Email{" "}
      <a href={`mailto:${contactEmail}?subject=${subject}`} className="underline">
        {contactEmail}
      </a>
    </>
  )
}

export function orderStatusCopy(
  state: OrderPaymentState,
  { couldNotOpenPayment, orderNumber, contactEmail }: OrderStatusContext,
): OrderStatusCopy {
  const contact = <ContactStore orderNumber={orderNumber} contactEmail={contactEmail} />

  switch (state.kind) {
    case "settled":
      return { settled: true, title: "Thank you for your order.", detail: null }
    case "awaiting_multibanco":
      return { settled: false, title: "Order received. Pay by Multibanco to confirm it.", detail: null }
    case "awaiting_payment":
      return couldNotOpenPayment
        ? {
            settled: false,
            title: "Your order isn't paid yet",
            detail: (
              <>
                We couldn&apos;t open payment. Your order is saved. {contact} with order #{orderNumber}.
              </>
            ),
          }
        : {
            settled: false,
            title: "Order received",
            detail: "We're waiting for your payment. We'll email you when it arrives.",
          }
    case "failed":
      return {
        settled: false,
        title: "This order wasn't paid",
        detail: (
          <>
            The payment didn&apos;t go through, so you haven&apos;t been charged. {contact} if you still
            want these items.
          </>
        ),
      }
    case "refunded":
      return {
        settled: false,
        title: "This order was refunded",
        detail: <>{contact} if you have any questions.</>,
      }
    case "cancelled_paid":
      return {
        settled: false,
        title: "This order was cancelled",
        detail: "Your payment arrived after it was cancelled. The store will refund you.",
      }
  }
}
