import type { ReactNode } from "react"
import type { OrderPaymentState } from "@prood/types"

interface OrderStatusContext {
  couldNotOpenPayment: boolean
  /** Part of the payment already went back, which `cancelled_paid` can't say. */
  partlyRefunded: boolean
  orderNumber: string
  /** `undefined` when the store couldn't be read, which isn't the same as none listed. */
  contactEmail: string | null | undefined
}

interface OrderStatusCopy {
  settled: boolean
  title: string
  detail: ReactNode
}

function mailStore(contactEmail: string, orderNumber: string) {
  return `mailto:${contactEmail}?subject=${encodeURIComponent(`Order #${orderNumber}`)}`
}

function EmailStore({ orderNumber, contactEmail }: { orderNumber: string; contactEmail: string }) {
  return (
    <>
      Email{" "}
      <a href={mailStore(contactEmail, orderNumber)} className="underline">
        {contactEmail}
      </a>
    </>
  )
}

/** With no contact email there's no way to reach the store, so the copy can't suggest it. */
export function orderStatusCopy(
  state: OrderPaymentState,
  { couldNotOpenPayment, partlyRefunded, orderNumber, contactEmail }: OrderStatusContext,
): OrderStatusCopy {
  const noEmail =
    contactEmail === null ? "This store hasn't listed a contact email." : "Contact the store if you have any questions."
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
              `We couldn't open payment. Your order #${orderNumber} is saved and the store can see it. ${noEmail} Keep this number.`
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
            This order was canceled before it was paid. You haven&apos;t been charged. {contact} if you still
            want these items.
          </>
        ) : (
          "This order was canceled before it was paid. You haven't been charged. To get these items, place a new order."
        ),
      }
    case "cancelled":
      return {
        settled: false,
        title: "This order was canceled",
        detail: contact ? (
          <>You haven&apos;t been charged. {contact} if you still want these items.</>
        ) : (
          "You haven't been charged. To get these items, place a new order."
        ),
      }
    case "refunded":
      return {
        settled: false,
        title: "This order was refunded",
        detail: contact ? (
          <>{contact} if you have any questions.</>
        ) : (
          noEmail
        ),
      }
    case "partially_refunded":
      return {
        settled: true,
        title: "Thank you for your order.",
        detail: contact ? <>Part of it was refunded. {contact} if you have any questions.</> : "Part of it was refunded.",
      }
    case "cancelled_paid": {
      // Canceling doesn't send anything back, so this can't promise a refund.
      const notReturned = partlyRefunded
        ? "This order was canceled and part of your payment was returned. The rest hasn't been returned yet."
        : "This order was canceled and your payment hasn't been returned yet."
      return {
        settled: false,
        title: "This order was canceled",
        detail:
          contactEmail === null ? (
            `${notReturned} ${noEmail}`
          ) : (
            <>
              {notReturned}{" "}
              {contactEmail ? (
                <a href={mailStore(contactEmail, orderNumber)} className="underline">
                  Contact the store
                </a>
              ) : (
                "Contact the store"
              )}{" "}
              about your refund.
            </>
          ),
      }
    }
  }
}
