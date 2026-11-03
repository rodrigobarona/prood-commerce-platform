import "server-only"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { canChangePlan, paidPlanIds, stripeLookupKey } from "@prood/billing"
import { syncOrganizationPlan } from "@prood/auth/billing"
import { getMemberRole } from "@prood/auth/membership"

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
  const sync = async ({ subscription }: { subscription: { referenceId: string } }) =>
    syncOrganizationPlan(subscription.referenceId)

  return stripe({
    stripeClient: new Stripe(secretKey),
    stripeWebhookSecret: webhookSecret,
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
      onSubscriptionComplete: sync,
      onSubscriptionCreated: sync,
      onSubscriptionUpdate: sync,
      onSubscriptionCancel: sync,
      onSubscriptionDeleted: sync,
    },
  })
}
