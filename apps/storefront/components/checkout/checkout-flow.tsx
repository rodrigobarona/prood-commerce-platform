"use client"

import { useCallback, useState } from "react"
import { CheckIcon } from "@phosphor-icons/react"
import { EmptyState } from "@prood/ui/components/empty-state"
import { cn } from "@prood/ui/lib/utils"
import { useCart } from "@/components/providers/cart-provider"
import { startCheckout } from "@/app/(checkout)/checkout/actions"
import { CheckoutSidebar } from "./checkout-sidebar"
import { ExpressCheckout } from "./express-checkout"
import { ContactStep } from "./steps/contact-step"
import { AddressStep } from "./steps/address-step"
import { ShippingStep } from "./steps/shipping-step"
import { ReviewStep } from "./steps/review-step"
import type { AddressValues, ContactValues, ShippingMethodValues } from "./schemas"

const STEPS = [
  { id: "contact", title: "Contact" },
  { id: "address", title: "Shipping address" },
  { id: "shipping", title: "Shipping method" },
  { id: "review", title: "Review" },
] as const

interface CheckoutData {
  contact?: ContactValues
  address?: AddressValues & { useSameForBilling?: boolean }
  shippingMethod?: ShippingMethodValues
  shippingMethodName?: string
}

function StepHeader({
  index,
  title,
  active,
  completed,
  summary,
  onEdit,
}: {
  index: number
  title: string
  active: boolean
  completed: boolean
  summary?: React.ReactNode
  onEdit?: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 text-left",
        !active && !completed && "opacity-50",
        (completed || active) && "cursor-pointer",
      )}
      onClick={completed && onEdit ? onEdit : undefined}
      disabled={!completed}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
          completed && "border-primary bg-primary text-primary-foreground",
          active && "border-primary text-primary",
          !completed && !active && "border-border text-muted-foreground",
        )}
      >
        {completed ? <CheckIcon weight="bold" className="size-3.5" /> : index + 1}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm font-medium",
            active || completed ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </span>
        {completed && summary ? (
          <span className="text-xs text-muted-foreground">{summary}</span>
        ) : null}
      </div>
      {completed && onEdit ? (
        <span className="shrink-0 text-xs text-primary">Edit</span>
      ) : null}
    </button>
  )
}

export function CheckoutFlow({ geoCountry }: { geoCountry?: string }) {
  const { cart, hydrating } = useCart()
  const [activeStep, setActiveStep] = useState(0)
  const [data, setData] = useState<CheckoutData>({})

  const goTo = useCallback((step: number) => setActiveStep(step), [])

  if (hydrating) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-muted sm:mb-8" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border bg-muted/30" />
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add something before checking out."
        actionLabel="Browse products"
        actionHref="/products"
      />
    )
  }

  function handleContactSubmit(values: ContactValues) {
    setData((prev) => ({ ...prev, contact: values }))
    goTo(1)
  }

  function handleAddressSubmit(
    values: AddressValues & { useSameForBilling: boolean },
  ) {
    setData((prev) => ({
      ...prev,
      address: values,
    }))
    goTo(2)
  }

  function handleShippingSubmit(values: ShippingMethodValues) {
    setData((prev) => ({
      ...prev,
      shippingMethod: values,
    }))
    goTo(3)
  }

  async function handleFinalSubmit() {
    if (!data.contact || !data.address) return

    const res = await startCheckout({
      email: data.contact.email,
      address: {
        firstName: data.address.firstName,
        lastName: data.address.lastName,
        phone: data.address.phone || data.contact.phone || undefined,
        street: data.address.street,
        street2: data.address.street2 || undefined,
        city: data.address.city,
        state: data.address.state || undefined,
        postalCode: data.address.postalCode || undefined,
        country: data.address.country,
      },
    })

    if (!res.ok) {
      throw new Error(res.error ?? "Checkout failed")
    }
    if (res.checkoutUrl) {
      window.location.href = res.checkoutUrl
    }
  }

  function stepSummary(stepIndex: number): React.ReactNode {
    switch (stepIndex) {
      case 0:
        return data.contact?.email
      case 1:
        if (!data.address) return null
        return `${data.address.firstName} ${data.address.lastName}, ${data.address.city}`
      case 2:
        return data.shippingMethodName ?? "Selected"
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-xl font-bold tracking-tight sm:mb-8 sm:text-2xl">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Order summary — top on mobile, right sidebar on desktop */}
        <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border p-4 sm:p-5">
            <h2 className="mb-4 hidden text-lg font-semibold lg:block">Order summary</h2>
            <CheckoutSidebar cart={cart} />
          </div>
        </div>

        {/* Left: Steps */}
        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <ExpressCheckout />
          {STEPS.map((step, i) => {
            const completed = i < activeStep
            const active = i === activeStep

            return (
              <div key={step.id} className="flex flex-col gap-4">
                <StepHeader
                  index={i}
                  title={step.title}
                  active={active}
                  completed={completed}
                  summary={completed ? stepSummary(i) : undefined}
                  onEdit={completed ? () => goTo(i) : undefined}
                />

                {active ? (
                  <div className="pl-8 sm:pl-10">
                    {i === 0 && (
                      <ContactStep
                        defaultValues={data.contact}
                        geoCountry={geoCountry}
                        onSubmit={handleContactSubmit}
                      />
                    )}
                    {i === 1 && (
                      <AddressStep
                        defaultValues={data.address}
                        geoCountry={geoCountry}
                        onSubmit={handleAddressSubmit}
                        onBack={() => goTo(0)}
                      />
                    )}
                    {i === 2 && (
                      <ShippingStep
                        cartId={cart.id}
                        defaultValues={data.shippingMethod}
                        onSubmit={handleShippingSubmit}
                        onBack={() => goTo(1)}
                      />
                    )}
                    {i === 3 && data.contact && data.address && (
                      <ReviewStep
                        contact={data.contact}
                        address={data.address}
                        shippingMethodName={data.shippingMethodName}
                        onSubmit={handleFinalSubmit}
                        onBack={() => goTo(2)}
                        onEditStep={goTo}
                      />
                    )}
                  </div>
                ) : null}

                {i < STEPS.length - 1 ? (
                  <div className="ml-3.5 border-l pl-6" />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
