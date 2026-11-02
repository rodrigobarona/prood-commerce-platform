"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import type { Product } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@prood/ui/components/command"
import { ProductInitial } from "@prood/ui/components/product-initial"
import { formatPrice, localized, resolveProductUrl, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface SearchPaletteProps {
  /** Async search callback returning matching products. */
  onSearch: (query: string) => Promise<Product[]>
  placeholder?: string
  locale?: Locale
  className?: string
}

export function SearchPalette({
  onSearch,
  placeholder = "Search products",
  locale = "en",
  className,
}: SearchPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    let active = true
    const trimmed = query.trim()
    const id = setTimeout(async () => {
      if (!trimmed) {
        if (active) setResults([])
        return
      }
      setLoading(true)
      try {
        const products = await onSearch(trimmed)
        if (active) setResults(products)
      } finally {
        if (active) setLoading(false)
      }
    }, 200)
    return () => {
      active = false
      clearTimeout(id)
    }
  }, [query, onSearch])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  const trimmed = query.trim()

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={placeholder}
        className={cn("size-10 [&_svg:not([class*='size-'])]:size-5", className)}
      >
        <MagnifyingGlassIcon />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description={placeholder}
        className="top-[12%] rounded-xl! sm:max-w-xl"
      >
        {/* The API has already matched these, in any language, so cmdk mustn't filter again. */}
        <Command
          shouldFilter={false}
          className="rounded-none bg-transparent [&_[data-slot=input-group]]:h-11! [&_[data-slot=input-group]]:border-transparent [&_[data-slot=input-group]]:bg-transparent"
        >
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[60svh]">
            {!loading && trimmed && results.length === 0 ? (
              <CommandEmpty>
                No results for &ldquo;{trimmed}&rdquo;. Check the spelling, or try a shorter search.
              </CommandEmpty>
            ) : null}
            {results.length > 0 ? (
              <CommandGroup heading="Products">
                {results.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                      onSelect={() => go(resolveProductUrl(product))}
                    className="gap-3 py-2"
                  >
                    <span className="bg-muted relative aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-md">
                      {product.primaryImage ? (
                        <Image src={product.primaryImage.url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <ProductInitial name={localized(product.name, locale)} className="text-lg" />
                      )}
                    </span>
                    <span className="flex-1 truncate">{localized(product.name, locale)}</span>
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {formatPrice(product.price, locale)}
                    </span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="all-results"
                  onSelect={() => go(`/products?q=${encodeURIComponent(trimmed)}`)}
                  className="gap-2 py-2.5"
                >
                  <span className="flex-1">See all results</span>
                  <ArrowRightIcon className="size-4" />
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
