import { getAdapter, revalidateProducts, type PaymentWebhookEvent } from "@workspace/commerce"

/** Best-effort extraction of an order id from a provider webhook payload. */
function resolveOrderId(event: PaymentWebhookEvent): string | null {
  const data = event.data as Record<string, unknown>
  // Stripe: event.data.object.metadata.orderId
  const object = (data?.data as { object?: Record<string, unknown> })?.object
  const metadata = object?.metadata as Record<string, string> | undefined
  if (metadata?.orderId) return metadata.orderId
  // Easypay/Ifthenpay: flat key/orderId on the payload
  if (typeof data?.orderId === "string") return data.orderId
  if (typeof data?.key === "string") return data.key
  return null
}

/**
 * Reconcile an order against a verified payment webhook event.
 * Marks the order processing on capture, or cancelled on failure.
 * Tolerant by design — webhook acknowledgement must not fail on reconciliation.
 */
export async function reconcilePayment(event: PaymentWebhookEvent): Promise<void> {
  const orderId = resolveOrderId(event)
  if (!orderId) return

  try {
    const adapter = await getAdapter()
    if (event.type === "payment.captured") {
      await adapter.updateOrderStatus(orderId, { status: "processing" })
      revalidateProducts()
    } else if (event.type === "payment.failed" || event.type === "payment.cancelled") {
      await adapter.updateOrderStatus(orderId, { status: "cancelled" })
    }
  } catch (err) {
    console.error("[reconcilePayment]", err)
  }
}
