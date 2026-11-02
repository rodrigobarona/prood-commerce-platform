import { CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr"

import { Receipt } from "@prood/ui/components/receipt"
import { cn } from "@prood/ui/lib/utils"

const DRAWING = "size-20 shrink-0 fill-none stroke-current stroke-[2.5] text-foreground xl:size-28"

function Phone() {
  return (
    <svg aria-hidden viewBox="0 0 96 96" className={DRAWING}>
      <rect x="27" y="7" width="42" height="82" rx="8" />
      <path d="M43 15 h10 M37 34 h22 M37 44 h22" />
      <rect x="36" y="62" width="24" height="12" rx="3" className="fill-brand stroke-none" />
    </svg>
  )
}

function Safe() {
  return (
    <svg aria-hidden viewBox="0 0 96 96" className={DRAWING}>
      <rect x="11" y="13" width="74" height="68" rx="6" />
      <path d="M23 81 v6 M73 81 v6 M85 29 h4 M85 65 h4" />
      <circle cx="48" cy="47" r="19" />
      <circle cx="48" cy="47" r="5" className="fill-brand stroke-none" />
      <path d="M48 28 v9 M48 57 v9 M29 47 h9 M58 47 h9" />
    </svg>
  )
}

function Till() {
  return (
    <svg aria-hidden viewBox="0 0 96 96" className={DRAWING}>
      <path d="M31 11 h34 v18 H31 z M16 43 L24 29 H72 L80 43 M16 43 h64 v24 H16 z M8 67 h80 v20 H8 z" />
      <path d="M28 52 h8 M44 52 h8 M60 52 h8 M28 59 h8 M44 59 h8 M60 59 h8" />
      <rect x="40" y="74" width="16" height="6" rx="2" className="fill-brand stroke-none" />
    </svg>
  )
}

/** The hero's key string, pulled long, with the sale riding on it. It runs from one stop into the next. */
const THREAD = "pointer-events-none absolute z-10 text-brand"
const STRING = { fill: "none", stroke: "currentColor", strokeWidth: 2.5, vectorEffect: "non-scaling-stroke" } as const

function Coin() {
  return (
    <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand font-mono text-sm font-medium text-brand-foreground">
      €
    </span>
  )
}

function Thread({ into, start }: { into: "stop" | "slip"; start: string }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          THREAD,
          "top-[4.75rem] left-[2.5rem] w-6 -translate-x-3 xl:hidden",
          into === "stop" ? "-bottom-[4.1rem]" : "-bottom-[4.9rem]"
        )}
      >
        <svg viewBox="0 0 24 100" preserveAspectRatio="none" className="size-full">
          <path d="M12 0 C24 30 0 70 12 100" {...STRING} />
        </svg>
        <Coin />
        {into === "stop" ? <CaretDownIcon weight="bold" className="absolute -bottom-2 left-1 size-4" /> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          THREAD,
          "top-11 hidden h-6 xl:block",
          start,
          into === "stop" ? "-right-[3.5rem]" : "-right-[4.25rem]"
        )}
      >
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="size-full">
          <path d="M0 12 C30 30 70 -6 100 12" {...STRING} />
        </svg>
        <Coin />
        {into === "stop" ? <CaretRightIcon weight="bold" className="absolute top-1 -right-2 size-4" /> : null}
      </span>
    </>
  )
}

const stops = [
  {
    Drawing: Phone,
    start: "xl:left-[5.1rem]",
    title: "Your customer pays",
    body: "At hosted checkout, by card, wallet, Multibanco or MB WAY.",
  },
  {
    Drawing: Safe,
    start: "xl:left-[6.5rem]",
    title: "Your provider takes it",
    body: "Stripe, Easypay or Ifthenpay, on your own account, at their own rates. Each store's checkout runs on one provider, and Stripe comes first if it's connected.",
  },
  {
    Drawing: Till,
    start: "xl:left-[6.5rem]",
    title: "You get paid",
    body: "Payouts go straight from your provider to you.",
  },
] as const

/** The punch through the slip's corner, where the string ends, as on the hero's receipt. */
const PUNCHED = {
  WebkitMask: "radial-gradient(circle 0.4rem at 1.25rem 1rem, #0000 97%, #000)",
  mask: "radial-gradient(circle 0.4rem at 1.25rem 1rem, #0000 97%, #000)",
} as const

/** One drawn string from the customer to the till slip: the sale, in the order the money moves. */
export function MoneyPath({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-y-16 xl:grid-cols-[repeat(3,minmax(0,1fr))_20rem] xl:gap-x-12", className)}>
      {stops.map(({ Drawing, start, title, body }, index) => (
        <li key={title} className="relative flex gap-5 xl:block">
          <Drawing />
          <Thread into={index === stops.length - 1 ? "slip" : "stop"} start={start} />
          <div className="min-w-0 pt-2 xl:mt-6 xl:pt-0">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 max-w-md leading-7 text-muted-foreground">{body}</p>
          </div>
        </li>
      ))}
      <li className="ml-5 max-w-72 xl:mt-10 xl:ml-0 xl:max-w-none">
        <div style={PUNCHED}>
          <Receipt
            className="max-w-none drop-shadow-none"
            heading="Order ORD-20261031-4K2Q"
            meta="Example order"
            lines={[
              { label: "Total paid", value: "€63.00" },
              { label: "Provider's fee", value: "Their rates" },
              { label: "Payout", value: "Direct to you", highlight: true, total: true },
            ]}
          />
        </div>
      </li>
    </ol>
  )
}
