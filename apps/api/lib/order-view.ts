import type { Order } from "@prood/types"

/** Whether an email is the one the order was placed with. */
export function isOrderEmail(order: Pick<Order, "contactEmail">, email: string | undefined): boolean {
  return Boolean(email && order.contactEmail?.toLowerCase() === email.trim().toLowerCase())
}

/**
 * An order for someone who only has its id. The email it was placed with also
 * shows the Multibanco reference a guest needs to pay.
 */
export function publicOrder(order: Order, emailMatches: boolean): Order {
  return {
    ...order,
    shippingAddress: null,
    billingAddress: null,
    paymentProvider: null,
    paymentTransactionId: null,
    paymentDetails: emailMatches ? order.paymentDetails : null,
    trackingNumber: null,
    trackingUrl: null,
    note: null,
    customerId: null,
    contactEmail: null,
  }
}
