import { countryName } from "@/lib/format"

/** Written the European way: postal code before the city. */
export function Address({
  address,
  named = true,
}: {
  address: {
    firstName: string
    lastName: string
    street: string
    street2?: string | null
    city: string
    state?: string | null
    postalCode?: string | null
    country: string
  }
  /** Leave out the name when the panel already shows it. */
  named?: boolean
}) {
  const place = [address.postalCode, address.city].filter(Boolean).join(" ")

  return (
    <address className="text-sm text-muted-foreground not-italic">
      {named ? (
        <span className="block font-medium text-foreground">
          {address.firstName} {address.lastName}
        </span>
      ) : null}
      <span className="block">
        {address.street}
        {address.street2 ? `, ${address.street2}` : ""}
      </span>
      <span className="block">
        {place}
        {address.state ? `, ${address.state}` : ""}
      </span>
      <span className="block">{countryName(address.country)}</span>
    </address>
  )
}
