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

function EmailStore({ orderNumber, contactEmail }: { orderNumber: string; contactEmail: string }) {
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

/** With no contact email there's no way to reach the store, so the copy can't suggest it. */
export function orderStatusCopy(
  state: OrderPaymentState,
  { couldNotOpenPayment, orderNumber, contactEmail }: OrderStatusContext,
): OrderStatusCopy {
  const contact = contactEmail ? (
    <EmailStore orderNumber={orderNumber} contactEmail={contactEmail} />
  ) : null

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
            detail: contact ? (
              <>
                We couldn&apos;t open payment. Your order is saved. {contact} with order #{orderNumber}.
              </>
            ) : (
              `We couldn't open payment. Your order #${orderNumber} is saved and the store can see it, but it hasn't listed a contact email. Keep this number.`
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
        detail: contact ? (
          <>
            The payment didn&apos;t go through, so you haven&apos;t been charged. {contact} if you still
            want these items.
          </>
        ) : (
          "The payment didn't go through, so you haven't been charged. To get these items, place a new order."
        ),
      }
    case "refunded":
      return {
        settled: false,
        title: "This order was refunded",
        detail: contact ? (
          <>{contact} if you have any questions.</>
        ) : (
          "This store hasn't listed a contact email."
        ),
      }
    case "partially_refunded":
      return {
        settled: true,
        title: "Thank you for your order.",
        detail: contact ? <>Part of it was refunded. {contact} if you have any questions.</> : "Part of it was refunded.",
      }
    case "cancelled_paid":
      return {
        settled: false,
        title: "This order was cancelled",
        detail: "Your payment arrived after it was cancelled. The store will refund you.",
      }
  }
}
