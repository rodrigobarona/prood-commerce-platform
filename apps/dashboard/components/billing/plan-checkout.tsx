"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  formatPrice,
  getPlan,
  paidPlanIds,
  type PaidPlanId,
  type PlanId,
} from "@prood/billing";
import { Button } from "@prood/ui/components/button";
import { cn } from "@prood/ui/lib/utils";
import { authClient } from "@/lib/auth/client";
import { withBase } from "@/lib/base-path";

type Props = {
  organizationId: string;
  currentPlanId: PlanId;
  /** A live Stripe subscription: plan changes and cancelling happen in Stripe's billing page. */
  subscribed: boolean;
  /** Paid before: past invoices stay in Stripe's billing page. */
  hasBillingHistory: boolean;
};

function billingUrl(query = ""): string {
  return `${window.location.origin}${withBase("/billing")}${query}`;
}

/** Starts Stripe Checkout for a paid plan, or opens Stripe's billing page once subscribed. */
export function PlanCheckout({
  organizationId,
  currentPlanId,
  subscribed,
  hasBillingHistory,
}: Props) {
  const [pending, setPending] = useState<PaidPlanId | "portal" | null>(null);

  /** On success the auth client leaves for Stripe, so only a failure comes back here. */
  async function open(
    target: PaidPlanId | "portal",
    go: () => Promise<{ error: unknown }>,
    failure: string,
  ) {
    setPending(target);
    const failed = await go().then(
      ({ error }) => !!error,
      () => true,
    );
    if (failed) {
      setPending(null);
      toast.error(failure);
    }
  }

  const choose = (plan: PaidPlanId) =>
    open(
      plan,
      () =>
        authClient.subscription.upgrade({
          plan,
          customerType: "organization",
          referenceId: organizationId,
          successUrl: billingUrl("?checkout=success"),
          cancelUrl: billingUrl(),
        }),
      "We couldn't open the payment page. Nothing was charged. Try again.",
    );

  const manage = () =>
    open(
      "portal",
      () =>
        authClient.subscription.billingPortal({
          customerType: "organization",
          referenceId: organizationId,
          returnUrl: billingUrl(),
        }),
      "We couldn't open your billing page. Try again.",
    );

  if (subscribed) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="outline" disabled={pending !== null} onClick={manage}>
          {pending === "portal" ? "Opening…" : "Manage billing"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Change plan, update your card, get invoices or cancel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-3">
        {paidPlanIds.map((id) => {
          const plan = getPlan(id);
          const current = id === currentPlanId;
          return (
            <li
              key={id}
              className={cn(
                "flex flex-col gap-3 rounded-lg border border-border p-4",
                current && "border-foreground",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{plan.name}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatPrice(plan.monthlyPriceCents)} a month
                </span>
              </div>
              <Button
                variant={id === "grow" ? "default" : "outline"}
                disabled={pending !== null || current}
                onClick={() => choose(id)}
              >
                {current
                  ? "Your plan"
                  : pending === id
                    ? "Opening…"
                    : `Choose ${plan.name}`}
              </Button>
            </li>
          );
        })}
      </ul>
      {hasBillingHistory ? (
        <Button
          variant="link"
          className="self-start px-0"
          disabled={pending !== null}
          onClick={manage}
        >
          {pending === "portal" ? "Opening…" : "Past invoices"}
        </Button>
      ) : null}
    </div>
  );
}
