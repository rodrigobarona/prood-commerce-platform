"use client"

import { useCallback, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { HeartIcon, ShoppingCartIcon, TrashIcon } from "@phosphor-icons/react"
import type { CartItem } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { formatPrice, localized, type Locale } from "@prood/ui/lib/commerce"

const STORAGE_KEY = "saved-for-later"
const EMPTY_SAVED_ITEMS: SavedItem[] = []
const listeners = new Set<() => void>()
let savedCache: SavedItem[] | null = null

export interface SavedItem {
  id: string
  productId: string
  productSlug?: string
  name: string
  variantName?: string
  image?: { url: string; alt?: string }
  unitPrice: { amount: number; currency: string; formatted?: string }
  savedAt: string
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
  return () => {
    listeners.delete(listener)
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
    const exists = prev.some((s) => s.productId === item.productId)
    if (exists) return
    persistSavedItems([item, ...prev])
  }, [])

  const remove = useCallback((productId: string) => {
    persistSavedItems(getSavedSnapshot().filter((s) => s.productId !== productId))
  }, [])

  return { items, save, remove }
}

interface SavedItemRowProps {
  item: SavedItem
  onMoveToCart: (item: SavedItem) => void
  onRemove: (productId: string) => void
}

function SavedItemRow({ item, onMoveToCart, onRemove }: SavedItemRowProps) {
  const url = `/products/${item.productSlug || item.productId}`

  return (
    <div className="flex gap-4">
      <Link
        href={url}
        className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg"
      >
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt || item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link href={url} className="text-sm font-medium hover:underline">
          {item.name}
        </Link>
        {item.variantName ? (
          <span className="text-muted-foreground text-xs">{item.variantName}</span>
        ) : null}
        <span className="text-sm font-semibold">
          {item.unitPrice.formatted ??
            formatPrice({
              amount: item.unitPrice.amount,
              currency: item.unitPrice.currency,
              formatted: "",
            })}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onMoveToCart(item)}
          aria-label="Move to cart"
        >
          <ShoppingCartIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.productId)}
          aria-label="Remove saved item"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}

interface SaveForLaterSectionProps {
  items: SavedItem[]
  onMoveToCart: (item: SavedItem) => void
  onRemove: (productId: string) => void
}

export function SaveForLaterSection({
  items,
  onMoveToCart,
  onRemove,
}: SaveForLaterSectionProps) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <HeartIcon className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          Saved for later{" "}
          <span className="text-muted-foreground font-normal">
            ({items.length})
          </span>
        </h2>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border p-5">
        {items.map((item) => (
          <SavedItemRow
            key={item.productId}
            item={item}
            onMoveToCart={onMoveToCart}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}
