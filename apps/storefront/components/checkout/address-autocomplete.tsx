"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { Input } from "@prood/ui/components/input"
import { cn } from "@prood/ui/lib/utils"

const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/autocomplete"
const DEBOUNCE_MS = 300
const MIN_CHARS = 3

interface GeoapifyFeature {
  type: "Feature"
  properties: {
    formatted: string
    housenumber?: string
    street?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
    address_line1?: string
    address_line2?: string
  }
}

interface GeoapifyResponse {
  type: "FeatureCollection"
  features: GeoapifyFeature[]
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
    ? `${street} ${housenumber}`.trim()
    : street

  return {
    street: streetLine || p.address_line1 || "",
    street2: p.suburb ?? "",
    city: p.city ?? "",
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
  const [query, setQuery] = useState(controlledValue ?? "")
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (controlledValue !== undefined) {
      setQuery(controlledValue)
    }
  }, [controlledValue])

  const fetchSuggestions = useCallback(
    async (text: string) => {
      abortRef.current?.abort()
      if (text.length < MIN_CHARS) {
        setSuggestions([])
        setOpen(false)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller

      const params = new URLSearchParams({
        text,
        apiKey,
        limit: "5",
        format: "geojson",
      })
      if (countryFilter) {
        params.set("filter", `countrycode:${countryFilter.toLowerCase()}`)
      }

      try {
        const res = await fetch(`${GEOAPIFY_URL}?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as GeoapifyResponse
        setSuggestions(data.features)
        setOpen(data.features.length > 0)
        setActiveIndex(-1)
      } catch {
        // aborted or network error
      }
    },
    [apiKey, countryFilter],
  )

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onChange?.(val)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS)
  }

  function handleSelect(feature: GeoapifyFeature) {
    const parsed = parseFeature(feature)
    setQuery(feature.properties.formatted)
    onChange?.(feature.properties.formatted)
    setSuggestions([])
    setOpen(false)
    onSelect(parsed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        )
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex])
        }
        break
      case "Escape":
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const listId = id ? `${id}-suggestions` : "address-suggestions"

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete={autoComplete ?? "off"}
          aria-invalid={ariaInvalid}
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          role="combobox"
          className="pl-9"
        />
      </div>

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {suggestions.map((feature, i) => (
            <li
              key={feature.properties.formatted + i}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2 text-sm transition-colors",
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(feature)}
            >
              {feature.properties.formatted}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
