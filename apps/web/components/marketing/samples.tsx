import { CheckIcon, RobotIcon } from "@phosphor-icons/react/dist/ssr"

import { BrowserFrame, PhoneFrame } from "@prood/ui/components/device-frame"
import { StatusBadge, type StatusTone } from "@prood/ui/components/status-badge"
import { Button } from "@prood/ui/components/button"
import { Receipt } from "@prood/ui/components/receipt"
import { cn } from "@prood/ui/lib/utils"

const orders: { id: string; customer: string; total: string; status: { label: string; tone: StatusTone } }[] = [
  { id: "ORD-20261031-4K2Q", customer: "Inês Carvalho", total: "€63.00", status: { label: "To fulfill", tone: "warning" } },
  { id: "ORD-20261031-9T7A", customer: "Tomás Ferreira", total: "€118.00", status: { label: "Awaiting payment", tone: "neutral" } },
  { id: "ORD-20261030-M3XD", customer: "Marta Lopes", total: "€36.90", status: { label: "Fulfilled", tone: "success" } },
  { id: "ORD-20261030-2HVP", customer: "Anna Keller", total: "€84.00", status: { label: "In progress", tone: "info" } },
  { id: "ORD-20261029-Z8LC", customer: "Rui Santos", total: "€29.50", status: { label: "Refunded", tone: "neutral" } },
]

/** The orders screen with sample data, simplified by hand: one line per order, and one status to act on. */
export function OrdersSample({ className }: { className?: string }) {
  return (
    <BrowserFrame url="prood.com/orders" className={className}>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-heading text-lg font-medium tracking-[-0.01em]">Orders</p>
          <p className="text-xs text-muted-foreground">Sample data</p>
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <caption className="sr-only">Sample orders with customer, status and total</caption>
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3 font-medium">Order</th>
              <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">Customer</th>
              <th scope="col" className="py-2 pr-3 font-medium">Status</th>
              <th scope="col" className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3 font-mono text-[0.6875rem] sm:text-xs">{order.id}</td>
                <td className="hidden py-2.5 pr-3 sm:table-cell">{order.customer}</td>
                <td className="py-2.5 pr-3">
                  <StatusBadge tone={order.status.tone}>{order.status.label}</StatusBadge>
                </td>
                <td className="py-2.5 text-right tabular-nums">{order.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BrowserFrame>
  )
}

const methods = [
  { name: "MB WAY", detail: "Pay on your phone", active: true },
  { name: "Multibanco", detail: "Pay by reference", active: false },
  { name: "Card", detail: "Visa, Mastercard", active: false },
]

/** Hosted checkout on a phone, simplified: one provider's methods in one checkout. */
export function CheckoutSample({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-72", className)}>
      <PhoneFrame className="surface-paper relative z-10 ring-1 ring-paper/15">
        <div className="px-5 pt-12 pb-6">
          <p className="text-xs text-muted-foreground">Sample checkout, on Easypay</p>
          <p className="mt-1 font-heading text-2xl font-medium tracking-[-0.01em] tabular-nums">€63.00</p>
          <ul className="mt-5 space-y-2 text-sm">
            {methods.map((method) => (
              <li
                key={method.name}
                className={
                  method.active
                    ? "flex items-center justify-between rounded-lg border-2 border-foreground px-3 py-2.5"
                    : "flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                }
              >
                <span>
                  <span className="block font-medium">{method.name}</span>
                  <span className="block text-xs text-muted-foreground">{method.detail}</span>
                </span>
                {method.active ? <CheckIcon weight="bold" className="size-4" aria-hidden /> : null}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex h-10 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
            Pay €63.00
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}

/** What Multibanco hands a shopper: the three things they key in, at an ATM or in their bank's app. */
export function MultibancoSample({ className }: { className?: string }) {
  return (
    <Receipt
      className={className}
      heading="Multibanco reference"
      meta="Sample payment"
      lines={[
        { label: "Entity", value: "12345" },
        { label: "Reference", value: "123 456 789" },
        { label: "Amount", value: "€63.00", total: true },
      ]}
      footer="Pay at a Multibanco ATM or in your banking app."
    />
  )
}

const clients = [
  { name: "Atelier Sol", host: "shop.atelier-sol.example", provider: "Easypay" },
  { name: "Café Exemplo", host: "cafe-exemplo.prood.app", provider: "Stripe" },
  { name: "Casa Lume", host: "loja.casalume.example", provider: "Ifthenpay" },
] as const

/** An agency's client stores as a ledger: one line each, nothing shared between them. */
export function ClientLedger({ className }: { className?: string }) {
  return (
    <figure className={cn("w-full max-w-96", className)}>
      <Receipt className="max-w-none" heading="Client stores" meta="Example ledger">
        <ul className="mt-4 divide-y divide-dashed divide-ink/30 border-t border-dashed border-ink/30">
          {clients.map((client) => (
            <li key={client.name} className="py-2.5">
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{client.name}</span>
                <span className="text-xs">{client.provider}</span>
              </span>
              <span className="block truncate text-xs text-ink/65">{client.host}</span>
            </li>
          ))}
        </ul>
      </Receipt>
      <figcaption className="sr-only">Example: three client stores, each with its own domain and payment provider.</figcaption>
    </figure>
  )
}

const keys = [
  { name: "Website", key: "pkAbC123...", scopes: "storefront", plan: "Every plan" },
  { name: "Stock sync", key: "pkDeF456...", scopes: "admin", plan: "From Grow" },
  { name: "Back office", key: "pkGhI789...", scopes: "storefront, admin", plan: "From Grow" },
] as const

/** The keys a store might hold, as a ledger: the scope is the line that matters. The first is the hero's tag. */
export function KeyLedger({ className }: { className?: string }) {
  return (
    <figure className={cn("w-full", className)}>
      <Receipt className="max-w-none drop-shadow-md drop-shadow-ink/15" heading="Key ledger" meta="Example keys">
        <ul className="mt-4 divide-y divide-dashed divide-ink/30 border-t border-dashed border-ink/30">
          {keys.map((entry) => (
            <li key={entry.name} className="py-3">
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{entry.name}</span>
                <span className="text-xs">{entry.plan}</span>
              </span>
              <span className="flex items-baseline justify-between gap-4 text-xs text-ink/65">
                <span>{entry.key}</span>
                <span>{entry.scopes}</span>
              </span>
            </li>
          ))}
        </ul>
      </Receipt>
      <figcaption className="sr-only">
        Example: three keys, one with the storefront scope, one with the admin scope and one with both.
      </figcaption>
    </figure>
  )
}

const connections: { name: string; methods: string; status: string; tone: StatusTone }[] = [
  {
    name: "Stripe",
    methods: "Cards, plus Apple Pay and Google Pay where you've enabled them",
    status: "Not connected",
    tone: "neutral",
  },
  { name: "Easypay", methods: "Multibanco, MB WAY, Card", status: "Connected", tone: "success" },
  { name: "Ifthenpay", methods: "Multibanco, MB WAY, Card", status: "Not connected", tone: "neutral" },
]

/** The dashboard's payments list, for one store, with sample data. */
export function IntegrationsSample({ className }: { className?: string }) {
  return (
    <BrowserFrame url="prood.com/payments" className={className}>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-heading text-lg font-medium tracking-[-0.01em]">Payments</p>
          <p className="text-xs text-muted-foreground">Sample data</p>
        </div>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {connections.map((connection) => (
            <li key={connection.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{connection.name}</span>
                <span className="block text-xs text-muted-foreground">{connection.methods}</span>
              </span>
              <StatusBadge tone={connection.tone}>{connection.status}</StatusBadge>
            </li>
          ))}
        </ul>
      </div>
    </BrowserFrame>
  )
}

/** An Agent Auth approval, the moment the merchant keeps the final say. */
export function ApprovalSample({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl shadow-ink/10">
        <p className="flex items-center gap-2 text-sm font-medium">
          <RobotIcon className="size-5 text-brand" aria-hidden />
          An AI agent asks to change your store
        </p>
        <dl className="mt-4 space-y-1 font-mono text-xs leading-5">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Asks for</dt>
            <dd className="text-right">
              adminListOrders
              <br />
              adminRefundOrder
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Lasts</dt>
            <dd className="text-right">1 hour idle, 24 at most</dd>
          </div>
        </dl>
        <div aria-hidden className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" tabIndex={-1} className="pointer-events-none">Approve access</Button>
          <Button size="sm" variant="outline" tabIndex={-1} className="pointer-events-none">Deny request</Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Sample approval</p>
    </div>
  )
}
