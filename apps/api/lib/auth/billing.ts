import "server-only"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import {
  canChangePlan,
  isLivePlanStatus,
  paidPlanIds,
  stripeLookupKey,
  type PaidPlanId,
} from "@prood/billing"
import { setOrganizationPlan, type LivePlan } from "@prood/auth/billing"
import { getMemberRole } from "@prood/auth/membership"

const PLAN_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
])

const planByLookupKey = new Map<string, PaidPlanId>(paidPlanIds.map((id) => [stripeLookupKey(id), id]))

/** The subscription still collecting for a customer, read from Stripe rather than from the event. */
export async function currentPlan(client: Stripe, customerId: string): Promise<LivePlan | null> {
  const { data } = await client.subscriptions.list({ customer: customerId, status: "all", limit: 20 })
  for (const sub of data) {
    const plan = sub.items.data.map((item) => planByLookupKey.get(item.price.lookup_key ?? "")).find(Boolean)
    if (plan && isLivePlanStatus(sub.status)) return { plan, status: sub.status, stripeSubscriptionId: sub.id }
  }
  return null
}

function eventCustomerId(event: Stripe.Event): string | null {
  const { customer } = event.data.object as { customer?: string | { id: string } | null }
  if (!customer) return null
  return typeof customer === "string" ? customer : customer.id
}

/**
 * Prood's own plans, billed to each store (organization) through the Prood
 * Stripe account. This is not a merchant's payment account: those are stored
 * per store and never read from env.
 *
 * Off until both keys are set. With a test key, only platform admins can
 * subscribe, so nobody gets a paid plan with a test card.
 */
export function billingPlugin() {
  const secretKey = process.env.BILLING_STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.BILLING_STRIPE_WEBHOOK_SECRET?.trim()
  if (!secretKey || !webhookSecret) return null

  const testMode = secretKey.startsWith("sk_test_")
  const client = new Stripe(secretKey)

  return stripe({
    stripeClient: client,
    stripeWebhookSecret: webhookSecret,
    // Errors here fail the webhook, so Stripe delivers it again. Reading Stripe
    // rather than the event means late or repeated events can't undo a change.
    onEvent: async (event) => {
      if (!PLAN_EVENTS.has(event.type)) return
      const customerId = eventCustomerId(event)
      if (customerId) await setOrganizationPlan(customerId, await currentPlan(client, customerId))
    },
    organization: {
      enabled: true,
      // The invoice goes to whoever runs the store, so the owner's email is the billing email.
      getCustomerCreateParams: async (_organization, ctx) => {
        const email = ctx.context.session?.user.email
        return { ...(email ? { email } : {}), preferred_locales: ["en"] }
      },
    },
    subscription: {
      enabled: true,
      plans: paidPlanIds.map((id) => ({ name: id, lookupKey: stripeLookupKey(id) })),
      authorizeReference: async ({ user, referenceId }) =>
        canChangePlan({ memberRole: await getMemberRole(referenceId, user.id), userRole: user.role, testMode }),
      // The certified invoice is issued in Portugal, so it needs the billing address and VAT number.
      getCheckoutSessionParams: () => ({
        params: {
          billing_address_collection: "required",
          tax_id_collection: { enabled: true },
          customer_update: { name: "auto", address: "auto" },
        },
      }),
    },
  })
}

/**
 * Prood bills stores, never people. The plugin skips `authorizeReference` for
 * personal subscriptions, so every subscription route has to name a store.
 * Stripe's redirect back after Checkout carries no body, so it's let through.
 */
export function isPersonalBillingRequest(path: string, customerType: unknown): boolean {
  return path.startsWith("/subscription/") && path !== "/subscription/success" && customerType !== "organization"
}
