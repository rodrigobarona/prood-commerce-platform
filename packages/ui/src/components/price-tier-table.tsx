import type { PriceTier } from "@prood/types"
import { formatPrice, localized, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface PriceTierTableProps {
  tiers: PriceTier[]
  locale?: Locale
  className?: string
}

export function PriceTierTable({ tiers, locale = "en", className }: PriceTierTableProps) {
  if (tiers.length === 0) return null

  return (
    <table className={cn("w-full text-sm", className)}>
      <thead>
        <tr className="text-muted-foreground border-b text-left">
          <th className="py-2 font-medium">Quantity</th>
          <th className="py-2 text-right font-medium">Unit price</th>
        </tr>
      </thead>
      <tbody>
        {tiers.map((tier) => (
          <tr key={tier.minQuantity} className="border-b last:border-0">
            <td className="py-2">
              {tier.label ? (
                <span className="mr-2 font-medium">{localized(tier.label, locale)}</span>
              ) : null}
              {tier.minQuantity}
              {tier.maxQuantity ? `–${tier.maxQuantity}` : "+"}
            </td>
            <td className="py-2 text-right font-semibold">
              {formatPrice(tier.unitPrice, locale)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
