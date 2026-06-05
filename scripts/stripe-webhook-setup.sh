#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Configure the Stripe webhook endpoint with all required events for
# Checkout Sessions + PaymentIntents integration.
#
# Prerequisites:
#   - Stripe CLI installed and authenticated (`stripe login`)
#
# Usage:
#   ./scripts/stripe-webhook-setup.sh                          # uses default URL
#   WEBHOOK_URL=https://custom.url/v1/webhooks/payments/stripe ./scripts/stripe-webhook-setup.sh
# ---------------------------------------------------------------------------

WEBHOOK_URL="${WEBHOOK_URL:-https://api-prood.vercel.app/v1/webhooks/payments/stripe}"

EVENTS=$(
  IFS=','
  echo "charge.refunded,\
checkout.session.async_payment_failed,\
checkout.session.async_payment_succeeded,\
checkout.session.completed,\
checkout.session.expired,\
payment_intent.amount_capturable_updated,\
payment_intent.canceled,\
payment_intent.payment_failed,\
payment_intent.processing,\
payment_intent.succeeded,\
refund.created"
)

echo "Webhook URL: $WEBHOOK_URL"
echo "Events (${#EVENTS//[^,]} + 1 total):"
echo "$EVENTS" | tr ',' '\n' | while read -r evt; do echo "  - $evt"; done
echo ""

ENDPOINT_ID=$(
  stripe webhook_endpoints list --limit 100 2>/dev/null \
    | grep -B5 "$WEBHOOK_URL" \
    | grep -o 'we_[a-zA-Z0-9]*' \
    | head -1 \
  || true
)

if [ -n "$ENDPOINT_ID" ]; then
  echo "Updating existing endpoint $ENDPOINT_ID..."
  stripe webhook_endpoints update "$ENDPOINT_ID" \
    --enabled-events="$EVENTS"
else
  echo "Creating new endpoint..."
  stripe webhook_endpoints create \
    --url="$WEBHOOK_URL" \
    --enabled-events="$EVENTS"
fi

echo ""
echo "Done. Verify at https://dashboard.stripe.com/webhooks"
