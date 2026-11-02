"use client"

import { useCallback, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import type { CartItem } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { ProductInitial } from "@prood/ui/components/product-initial"
import { formatPrice, localized, type Locale } from "@prood/ui/lib/commerce"

const STORAGE_KEY = "saved-for-later"
const EMPTY_SAVED_ITEMS: SavedItem[] = []
const listeners = new Set<() => void>()
let savedCache: SavedItem[] | null = null

export interface SavedItem {
  id: string
  productId: string
  productSlug?: string
  variantId?: string
  name: string
  variantName?: string
  image?: { url: string; alt?: string }
  unitPrice: { amount: number; currency: string; formatted?: string }
  savedAt: string
}

/** Variants of a product are saved separately, as cart lines are. */
export function savedItemKey(item: Pick<SavedItem, "productId" | "variantId">): string {
  return `${item.productId}:${item.variantId ?? ""}`
}

function readSaved(): SavedItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedItem[]) : []
  } catch {
    return []
  }
}

function writeSaved(items: SavedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage full or blocked
  }
}

function emitSavedChange() {
  for (const listener of listeners) listener()
}

function getSavedSnapshot(): SavedItem[] {
  if (typeof window === "undefined") return EMPTY_SAVED_ITEMS
  savedCache ??= readSaved()
  return savedCache
}

function getServerSavedSnapshot(): SavedItem[] {
  return EMPTY_SAVED_ITEMS
}

function subscribeSavedItems(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    savedCache = null
    listener()
  }
  window.addEventListener("storage", onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function persistSavedItems(items: SavedItem[]) {
  savedCache = items
  writeSaved(items)
  emitSavedChange()
}

export function cartItemToSaved(item: CartItem, locale: Locale = "en"): SavedItem {
  return {
    id: item.id,
    productId: item.productId,
    productSlug: item.productSlug,
    variantId: item.variantId ?? undefined,
    name: localized(item.name, locale),
    variantName: item.variantName ? localized(item.variantName, locale) : undefined,
    image: item.image ? { url: item.image.url, alt: item.image.alt ?? undefined } : undefined,
    unitPrice: {
      amount: item.price.amount,
      currency: item.price.currency,
      formatted: item.price.formatted ?? undefined,
    },
    savedAt: new Date().toISOString(),
  }
}

export function useSavedItems() {
  const items = useSyncExternalStore(
    subscribeSavedItems,
    getSavedSnapshot,
    getServerSavedSnapshot,
  )

  const save = useCallback((item: SavedItem) => {
    const prev = getSavedSnapshot()
    const exists = prev.some((s) => savedItemKey(s) === savedItemKey(item))
    if (exists) return
    persistSavedItems([item, ...prev])
  }, [])

  const remove = useCallback((key: string) => {
    persistSavedItems(getSavedSnapshot().filter((s) => savedItemKey(s) !== key))
  }, [])

  return { items, save, remove }
}

interface SavedItemRowProps {
  item: SavedItem
  /** Omit while items can't be added to the cart. */
  onMoveToCart?: (item: SavedItem) => void
  onRemove: (key: string) => void
}

function SavedItemRow({ item, onMoveToCart, onRemove }: SavedItemRowProps) {
  const url = `/products/${item.productSlug || item.productId}`

  return (
    <li className="flex gap-4 border-b py-5 first:border-t">
      <Link
        href={url}
        tabIndex={-1}
        aria-hidden
        className="bg-muted relative aspect-[4/5] w-16 shrink-0 self-start overflow-hidden rounded-lg"
      >
        {item.image ? (
          <Image src={item.image.url} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <ProductInitial name={item.name} className="text-2xl" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <div className="flex items-start justify-between gap-3">
          <Link href={url} className="underline-offset-4 hover:underline">
            {item.name}
          </Link>
          <span className="tabular-nums whitespace-nowrap">
            {item.unitPrice.formatted ??
              formatPrice({
                amount: item.unitPrice.amount,
                currency: item.unitPrice.currency,
                formatted: "",
              })}
          </span>
        </div>
        {item.variantName ? <span className="text-muted-foreground">{item.variantName}</span> : null}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground hover:text-foreground h-auto px-0 py-1 font-normal"
            disabled={!onMoveToCart}
            onClick={() => onMoveToCart?.(item)}
            aria-label={`Move to cart: ${item.name}`}
          >
            Move to cart
          </Button>
          <span aria-hidden className="text-muted-foreground px-1">
            ·
          </span>
          <Button
            type="button"
            variant="link"
            className="text-muted-foreground hover:text-foreground h-auto px-0 py-1 font-normal"
            onClick={() => onRemove(savedItemKey(item))}
            aria-label={`Remove ${item.name} from saved items`}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  )
}

interface SaveForLaterSectionProps {
  items: SavedItem[]
  onMoveToCart?: (item: SavedItem) => void
  onRemove: (key: string) => void
}

export function SaveForLaterSection({
  items,
  onMoveToCart,
  onRemove,
}: SaveForLaterSectionProps) {
  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-sans text-base font-medium">
        Saved for later{" "}
        <span className="text-muted-foreground font-normal tabular-nums">({items.length})</span>
      </h2>
      <ul className="flex flex-col">
        {items.map((item) => (
          <SavedItemRow
            key={savedItemKey(item)}
            item={item}
            onMoveToCart={onMoveToCart}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  )
}
