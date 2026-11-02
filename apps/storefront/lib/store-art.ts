import { DEMO_ORG_ID } from "@prood/platform"

/** Photographs from `@prood/media`, by slug. */
export interface StoreArt {
  hero: string
  /** The hero's line, when the store's description belongs in the footer alone. */
  headline: string
  /** The closing block: a photo, the store's story, and where to go next. */
  story: { photo: string; title: string; text: string; link: { label: string; href: string } }
  /** A category's tile by category slug, so a product's photo doesn't appear twice. */
  tiles: Record<string, string>
  /** Headings with a voice, where a real store has plain ones. */
  categories: { title: string; text: string }
  featured: { title: string; text: string }
  /** The grid after the pairing. */
  more: { title: string }
  /** Breaks the grid of products in two. */
  pairing: { lead: string; inset: string; title: string; text: string; link: { label: string; href: string } }
}

// The API has no field for a store's art direction yet, so a real store's home
// is built from its own category and product photos. This table only dresses
// the seeded demo, and it's keyed by tenant id so a store with the same name
// gets nothing from it.
const ART: Record<string, StoreArt> = {
  [DEMO_ORG_ID]: {
    hero: "product-plates",
    headline: "Plates, mugs and linen for every day.",
    story: {
      photo: "pair-wrapping",
      title: "Wrapped by hand, one order at a time.",
      text: "Casa Exemplo is a made-up store, so nothing ships here. Fill a cart and try the checkout.",
      link: { label: "Browse tableware", href: "/categories/tableware" },
    },
    tiles: { tableware: "maker-studio", linen: "product-linen-stone", living: "product-candle" },
    categories: {
      title: "Three corners of the house",
      text: "A short range, and every piece has to earn its shelf.",
    },
    featured: {
      title: "What we reach for first",
      text: "The things that never make it back to the cupboard.",
    },
    more: { title: "More from the shelves" },
    pairing: {
      lead: "product-linen-fork",
      inset: "product-mug-glazed-rim",
      title: "Coffee, on the good linen.",
      text: "The striped runner and the speckled mug, for a morning with nowhere to be.",
      link: { label: "See the mug", href: "/products/stoneware-mug" },
    },
  },
}

export function storeArt(tenantId: string): StoreArt | null {
  return ART[tenantId] ?? null
}
