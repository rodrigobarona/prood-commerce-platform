"use client"

import { useCallback, useEffect, useRef, useState, type Ref } from "react"
import Link from "next/link"
import type { PaymentMethodKind } from "@prood/types"
import { EmptyState } from "@prood/ui/components/empty-state"
import { Skeleton } from "@prood/ui/components/skeleton"
import { formatPrice, localized } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"
import { useCart } from "@/components/providers/cart-provider"
import { startCheckout } from "@/app/(checkout)/checkout/actions"
import { clearDraft, readDraft, saveDraft, type CheckoutDraft } from "@/lib/checkout-draft"
import { STORE_CLOSED_MESSAGE, canCheckOut } from "@/lib/store-status"
import { CheckoutSidebar } from "./checkout-sidebar"
import { ContactStep } from "./steps/contact-step"
import { AddressStep } from "./steps/address-step"
import { ShippingStep } from "./steps/shipping-step"
import { ReviewStep } from "./steps/review-step"
import { addressSchema, contactSchema, type AddressValues, type ContactValues } from "./schemas"

const STEPS = [
  { id: "contact", title: "Contact" },
  { id: "address", title: "Shipping address" },
  { id: "shipping", title: "Shipping method" },
  { id: "review", title: "Review" },
] as const

interface CheckoutData {
  contact?: ContactValues
  address?: AddressValues & { useSameForBilling?: boolean }
}

/** The furthest step a saved draft can resume at: one whose earlier steps still hold up. */
function resumeStep({ contact, address, step = 0 }: CheckoutDraft): number {
  if (!contactSchema.safeParse(contact).success) return 0
  if (!addressSchema.safeParse(address).success) return Math.min(step, 1)
  return step
}

function formatAddress(address: AddressValues): string {
  const country = new Intl.DisplayNames(["en"], { type: "region" }).of(address.country)
  return [
    `${address.firstName} ${address.lastName}`,
    address.street,
    address.street2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.state,
    country,
  ]
    .filter(Boolean)
    .join(", ")
}

function StepHeader({
  index,
  title,
  active,
  completed,
  summary,
  onEdit,
  headingRef,
}: {
  index: number
  title: string
  active: boolean
  completed: boolean
  summary?: React.ReactNode
  onEdit?: () => void
  /** Takes focus when this step opens. */
  headingRef?: Ref<HTMLHeadingElement>
}) {
  const heading = (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className={cn("text-base", active || completed ? "text-foreground" : "text-muted-foreground")}>
        {index + 1}. {title}
      </span>
      {completed && summary ? (
        <span className="text-muted-foreground text-sm">{summary}</span>
      ) : null}
    </span>
  )

  return (
    <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="font-sans outline-none">
      {completed && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="group/step flex w-full items-start justify-between gap-4 text-left"
        >
          {heading}
          <span className="text-muted-foreground group-hover/step:text-foreground shrink-0 text-sm underline underline-offset-4">
            Edit<span className="sr-only"> {title.toLowerCase()}</span>
          </span>
        </button>
      ) : (
        heading
      )}
    </h2>
  )
}

function CheckoutColumns({ work, summary }: { work: React.ReactNode; summary: React.ReactNode }) {
  return (
    <div className="grid flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="bg-muted/50 border-b lg:col-start-2 lg:row-start-1 lg:border-b-0 lg:border-l">
        <div className="w-full max-w-xl px-5 py-4 md:px-8 lg:sticky lg:top-0 lg:max-w-md lg:px-12 lg:py-12">
          {summary}
        </div>
      </div>
      <div className="lg:col-start-1 lg:row-start-1">
        {/* Starts where the header's store name does, at any width. */}
        <div className="max-w-xl px-5 pt-5 pb-8 md:px-8 md:py-12 lg:ml-[max(0px,calc((100vw-84rem)/2))] lg:max-w-[42rem] lg:px-12 [&_[data-slot=input]]:h-11 [&_[data-slot=select-trigger]]:h-11 [&_[data-slot=select-trigger]]:w-full">
          {work}
        </div>
      </div>
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <CheckoutColumns
      work={
        <div className="flex flex-col gap-6">
          <h1 className="sr-only">Checkout</h1>
          <Skeleton aria-hidden className="h-10 w-40 rounded-lg" />
          <Skeleton aria-hidden className="h-6 w-48 rounded-md" />
          <Skeleton aria-hidden className="h-11 rounded-lg" />
          <Skeleton aria-hidden className="h-11 rounded-lg" />
        </div>
      }
      summary={<Skeleton aria-hidden className="h-6 rounded-md lg:h-64" />}
    />
  )
}

export function CheckoutFlow({
  geoCountry,
  storeCountry,
  demo = false,
  signUpUrl,
  storeEmail,
  paymentMethods = [],
}: {
  geoCountry?: string
  /** Where the address form starts. */
  storeCountry?: string
  /** The demo store: everything works but placing the order. */
  demo?: boolean
  /** Where the demo's last step sends someone who wants a store of their own. */
  signUpUrl?: string
  /** Where questions go at the last step, when the store has listed an address. */
  storeEmail?: string | null
  /** How the next page will take payment. */
  paymentMethods?: readonly PaymentMethodKind[]
}) {
  const { cart, canTakeOrders, hydrating, setShippingMethod } = useCart()
  const [draft] = useState(readDraft)
  const [activeStep, setActiveStep] = useState(() => resumeStep(draft))
  const [data, setData] = useState<CheckoutData>({
    contact: draft.contact as ContactValues | undefined,
    address: draft.address as AddressValues | undefined,
  })
  const [closed, setClosed] = useState(false)
  const activeHeadingRef = useRef<HTMLHeadingElement>(null)
  const firstStepRef = useRef(true)

  const goTo = useCallback((step: number) => {
    setActiveStep(step)
    saveDraft({ step })
  }, [])
  const saveContact = useCallback((contact: Partial<ContactValues>) => saveDraft({ contact }), [])
  const saveAddress = useCallback((address: Partial<AddressValues>) => saveDraft({ address }), [])

  // The step's form just replaced whatever held focus, which would leave it on <body>.
  useEffect(() => {
    if (firstStepRef.current) firstStepRef.current = false
    else activeHeadingRef.current?.focus()
  }, [activeStep])

  if (hydrating) return <CheckoutSkeleton />

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        title="Your cart is empty"
        description="Add something before checking out."
        actionLabel="Browse products"
        actionHref="/products"
        className="flex-1"
      />
    )
  }

  if (closed) {
    return (
      <EmptyState
        headingLevel="h1"
        title="This store isn't taking orders right now"
        description="Your cart is saved, so try again later."
        actionLabel="Back to store"
        actionHref="/"
        className="flex-1"
      />
    )
  }

  if (!canCheckOut(canTakeOrders, cart)) {
    return (
      <EmptyState
        headingLevel="h1"
        title={STORE_CLOSED_MESSAGE}
        description="Your cart is saved. Check back soon."
        actionLabel="Back to store"
        actionHref="/"
        className="flex-1"
      />
    )
  }

  const steps = STEPS.filter((step) => cart.requiresShipping || step.id !== "shipping")
  // A draft can outlive what it resumed to: the cart may have lost its method, or its need for one.
  const shippingOpen = cart.requiresShipping && !cart.shippingMethod
  const currentStep =
    activeStep === 3 && shippingOpen ? 2 : activeStep === 2 && !cart.requiresShipping ? 3 : activeStep

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
    goTo(cart?.requiresShipping ? 2 : 3)
  }

  async function handleFinalSubmit() {
    if (!data.contact || !data.address) return

    const res = await startCheckout({
      email: data.contact.email,
      address: {
        firstName: data.address.firstName,
        lastName: data.address.lastName,
        phone: data.contact.phone || undefined,
        street: data.address.street,
        street2: data.address.street2 || undefined,
        city: data.address.city,
        state: data.address.state || undefined,
        postalCode: data.address.postalCode || undefined,
        country: data.address.country,
      },
    })

    if (res.closed) {
      setClosed(true)
      return
    }
    if (!res.ok) {
      throw new Error(res.error ?? "Checkout failed")
    }
    clearDraft()
    if (res.checkoutUrl) {
      window.location.href = res.checkoutUrl
    }
  }

  function stepSummary(stepIndex: number): React.ReactNode {
    switch (stepIndex) {
      case 0:
        return [data.contact?.email, data.contact?.phone].filter(Boolean).join(" · ")
      case 1:
        return data.address ? formatAddress(data.address) : null
      case 2: {
        const method = cart?.shippingMethod
        if (!method) return null
        return `${localized(method.name)} · ${method.price.amount === 0 ? "Free" : formatPrice(method.price)}`
      }
      default:
        return null
    }
  }

  return (
    <CheckoutColumns
      summary={<CheckoutSidebar cart={cart} />}
      work={
        <>
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <h1 className="text-display-sm">Checkout</h1>
            <Link
              href="/cart"
              className="text-muted-foreground hover:text-foreground pb-1 text-sm transition-colors"
            >
              Back to cart
            </Link>
          </div>
          <ol className="flex flex-col border-t">
            {steps.map((step, position) => {
              const i = STEPS.indexOf(step)
              const completed = i < currentStep
              const active = i === currentStep

              return (
                <li key={step.id} className="flex flex-col gap-5 border-b py-5">
                  <StepHeader
                    index={position}
                    title={step.title}
                    active={active}
                    completed={completed}
                    summary={completed ? stepSummary(i) : undefined}
                    onEdit={completed ? () => goTo(i) : undefined}
                    headingRef={active ? activeHeadingRef : undefined}
                  />

                  {active ? (
                    <div>
                      {i === 0 && (
                        <ContactStep
                          defaultValues={data.contact}
                          geoCountry={geoCountry}
                          onChange={saveContact}
                          onSubmit={handleContactSubmit}
                        />
                      )}
                      {i === 1 && (
                        <AddressStep
                          defaultValues={data.address}
                          geoCountry={geoCountry}
                          storeCountry={storeCountry}
                          demo={demo}
                          onChange={saveAddress}
                          onSubmit={handleAddressSubmit}
                          onBack={() => goTo(0)}
                          continueLabel={cart.requiresShipping ? "Continue to shipping" : "Continue to review"}
                        />
                      )}
                      {i === 2 && (
                        <ShippingStep
                          cartId={cart.id}
                          defaultValues={
                            cart.shippingMethod ? { methodId: cart.shippingMethod.id } : undefined
                          }
                          onSelect={setShippingMethod}
                          onSubmit={() => goTo(3)}
                          onBack={() => goTo(1)}
                        />
                      )}
                      {i === 3 && data.contact && data.address && (
                        <ReviewStep
                          demo={demo}
                          signUpUrl={signUpUrl}
                          cart={cart}
                          storeEmail={storeEmail}
                          paymentMethods={paymentMethods}
                          onSubmit={handleFinalSubmit}
                          onBack={() => goTo(cart.requiresShipping ? 2 : 1)}
                        />
                      )}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </>
      }
    />
  )
}
