import { CreditCardIcon, CurrencyDollarIcon, GlobeIcon } from "@phosphor-icons/react/dist/ssr"

import { valueStripItems } from "@/lib/site"

const icons = [CurrencyDollarIcon, CreditCardIcon, GlobeIcon] as const

export function ValueStripSection() {
  return (
    <section className="marketing-section-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3 md:gap-8 md:py-16">
        {valueStripItems.map((item, index) => {
          const Icon = icons[index]!
          return (
            <div
              key={item.title}
              className="relative flex gap-4 md:block md:px-2"
            >
              {index > 0 ? (
                <div
                  className="absolute -left-4 top-8 hidden h-16 w-px bg-border/80 md:-left-4 md:block lg:-left-6"
                  aria-hidden
                />
              ) : null}
              <div className="marketing-value-icon shrink-0">
                <Icon className="size-4" weight="duotone" aria-hidden />
              </div>
              <div className="min-w-0 md:mt-4">
                <h3 className="marketing-heading-sm">{item.title}</h3>
                <p className="marketing-copy mt-2">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
