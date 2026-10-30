import { Section, SectionHeading } from "@/components/marketing/section"
import { paymentProviders } from "@/lib/payment-providers"

const facts = [
  { value: "0%", label: "Prood fee on your sales" },
  { value: "Per store", label: "Encrypted payment credentials" },
  { value: "Direct", label: "Payouts from your provider to you" },
] as const

export function Payments() {
  return (
    <Section labelledBy="payments-title">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <SectionHeading
            id="payments-title"
            eyebrow="Payments"
            title="Take payments the way your customers pay."
            description="Connect your own accounts. Cards and wallets go through Stripe; Multibanco and MB WAY through Easypay or Ifthenpay. The money goes straight to you."
          />
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col">
                <dt className="text-sm leading-5 text-muted-foreground">{fact.label}</dt>
                <dd className="order-first mb-2 font-heading text-2xl font-semibold tracking-[-0.02em]">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <ul className="grid gap-4">
          {paymentProviders.map((provider) => (
            <li key={provider.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">{provider.name}</h3>
                <span className="text-sm text-muted-foreground">{provider.region}</span>
              </div>
              <p className="mt-2 leading-7 text-muted-foreground">{provider.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${provider.name} payment methods`}>
                {provider.methods.map((method) => (
                  <li key={method} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                    {method}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
