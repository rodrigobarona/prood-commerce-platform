import { pricingTrustPoints } from "@/lib/pricing"

export function PricingTrustSection() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {pricingTrustPoints.map((point) => (
        <div key={point.title} className="surface-card rounded-lg p-6">
          <h3 className="marketing-heading-sm">{point.title}</h3>
          <p className="marketing-copy mt-2">{point.description}</p>
        </div>
      ))}
    </div>
  )
}
