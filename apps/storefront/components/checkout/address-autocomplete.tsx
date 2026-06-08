"use client"

import { useEffect, useMemo, useRef } from "react"
import type { CountyCode } from "@geoapify/geocoder-autocomplete"
import {
  GeoapifyContext,
  GeoapifyGeocoderAutocomplete,
} from "@geoapify/react-geocoder-autocomplete"
import { cn } from "@prood/ui/lib/utils"

const DEBOUNCE_MS = 300

interface GeoapifyFeature {
  type: "Feature"
  properties: {
    formatted: string
    housenumber?: string
    street?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
    address_line1?: string
    address_line2?: string
  }
}

export interface ParsedAddress {
  street: string
  street2: string
  city: string
  state: string
  postalCode: string
  country: string
}

function parseFeature(f: GeoapifyFeature): ParsedAddress {
  const p = f.properties
  const housenumber = p.housenumber ?? ""
  const street = p.street ?? ""
  const streetLine = housenumber
    ? `${housenumber} ${street}`.trim()
    : street

  return {
    street: p.address_line1 || streetLine || "",
    street2: p.suburb ?? "",
    city: p.city ?? p.town ?? p.village ?? p.county ?? "",
    state: p.state ?? "",
    postalCode: p.postcode ?? "",
    country: (p.country_code ?? "").toUpperCase(),
  }
}

interface AddressAutocompleteProps {
  apiKey: string
  value?: string
  countryFilter?: string
  placeholder?: string
  id?: string
  autoComplete?: string
  "aria-invalid"?: boolean
  onSelect: (address: ParsedAddress) => void
  onChange?: (value: string) => void
  className?: string
}

export function AddressAutocomplete({
  apiKey,
  value: controlledValue,
  countryFilter,
  placeholder = "Start typing an address…",
  id,
  autoComplete,
  "aria-invalid": ariaInvalid,
  onSelect,
  onChange,
  className,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const countryCodes = useMemo(
    () =>
      countryFilter
        ? [countryFilter.toLowerCase() as CountyCode]
        : undefined,
    [countryFilter],
  )

  function handleSelect(feature: GeoapifyFeature | null) {
    if (!feature?.properties) return
    const parsed = parseFeature(feature)
    onSelect(parsed)
  }

  useEffect(() => {
    const rootElement = containerRef.current
    if (!rootElement) return

    function applyInputAttributes() {
      const input = containerRef.current?.querySelector("input")
      if (!input) return

      if (id) input.id = id
      if (autoComplete) input.setAttribute("autocomplete", autoComplete)
      if (ariaInvalid === undefined) {
        input.removeAttribute("aria-invalid")
      } else {
        input.setAttribute("aria-invalid", String(ariaInvalid))
      }
    }

    applyInputAttributes()
    const observer = new MutationObserver(applyInputAttributes)
    observer.observe(rootElement, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [ariaInvalid, autoComplete, id])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative [&_.geoapify-autocomplete-input]:h-8 [&_.geoapify-autocomplete-input]:w-full [&_.geoapify-autocomplete-input]:rounded-2xl [&_.geoapify-autocomplete-input]:border-transparent [&_.geoapify-autocomplete-input]:bg-input/50 [&_.geoapify-autocomplete-input]:px-2.5 [&_.geoapify-autocomplete-input]:py-1 [&_.geoapify-autocomplete-input]:text-base [&_.geoapify-autocomplete-input]:outline-none [&_.geoapify-autocomplete-input]:transition-[color,box-shadow] [&_.geoapify-autocomplete-input]:duration-200 [&_.geoapify-autocomplete-input]:placeholder:text-muted-foreground [&_.geoapify-autocomplete-input]:focus-visible:border-ring [&_.geoapify-autocomplete-input]:focus-visible:ring-3 [&_.geoapify-autocomplete-input]:focus-visible:ring-ring/30 [&_.geoapify-autocomplete-input]:aria-invalid:border-destructive [&_.geoapify-autocomplete-input]:aria-invalid:ring-3 [&_.geoapify-autocomplete-input]:aria-invalid:ring-destructive/20 [&_.geoapify-autocomplete-items]:z-50 [&_.geoapify-autocomplete-items]:rounded-lg [&_.geoapify-autocomplete-items]:border [&_.geoapify-autocomplete-items]:bg-popover [&_.geoapify-autocomplete-items]:text-popover-foreground [&_.geoapify-autocomplete-items]:shadow-md md:[&_.geoapify-autocomplete-input]:text-sm dark:[&_.geoapify-autocomplete-input]:aria-invalid:border-destructive/50 dark:[&_.geoapify-autocomplete-input]:aria-invalid:ring-destructive/40",
        className,
      )}
    >
      <GeoapifyContext apiKey={apiKey}>
        <GeoapifyGeocoderAutocomplete
          value={controlledValue}
          placeholder={placeholder}
          limit={5}
          debounceDelay={DEBOUNCE_MS}
          filterByCountryCode={countryCodes}
          skipIcons
          allowNonVerifiedHouseNumber
          allowNonVerifiedStreet
          placeSelect={handleSelect}
          onUserInput={onChange}
        />
      </GeoapifyContext>
    </div>
  )
}
