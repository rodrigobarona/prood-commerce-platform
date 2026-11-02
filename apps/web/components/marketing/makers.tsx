import { MediaImage } from "@prood/media/image"
import { TileEdge } from "@prood/ui/components/tile"
import { cn } from "@prood/ui/lib/utils"
import { deco, fatface, gilded, script, slab, stencil } from "@/components/marketing/sign-lettering"
import { Container } from "@/components/marketing/section"
import { StreetControls } from "@/components/marketing/street-controls"

/** Glass-fronted board, in Ink with a Paper edge so it lifts off the Ink street. */
const GLASS = "bg-ink text-paper ring-2 ring-inset ring-paper/60"
const PAINTED = "bg-paper text-ink"

/**
 * Trades that post well, because shipping is fixed and there's no pickup yet.
 * Names only ever go over hands and goods, never over a face, and each is labelled.
 */
const shops = [
  { slug: "product-bowls", name: "Atelier Sol", trade: "Pottery", position: "50% 30%", board: PAINTED, lettering: cn(deco.className, "text-[2.125rem]") },
  { slug: "product-candles", name: "Casa Lume", trade: "Candles", position: "60% 80%", board: GLASS, lettering: cn(script.className, "text-[2.5rem]") },
  { slug: "leather-roll", name: "Couro Novo", trade: "Leather goods", position: "50% 70%", board: PAINTED, lettering: cn(slab.className, "text-[1.875rem] text-telha") },
  { slug: "maker-jeweler", name: "Prata e Ouro", trade: "Jewelry", position: "50% 100%", board: GLASS, lettering: cn(gilded.className, "text-[1.625rem] tracking-[0.06em] uppercase") },
  { slug: "product-linen", name: "Linho do Rio", trade: "Linen", position: "50% 50%", board: PAINTED, lettering: cn(fatface.className, "text-[2.125rem]") },
  { slug: "tool-rack", name: "Oficina Nove", trade: "Woodwork", position: "72% 50%", board: GLASS, lettering: cn(stencil.className, "text-[1.75rem] tracking-[0.04em] uppercase") },
] as const

/** Doors are 4:5, and a source no wider than square fills that height at this width. */
const DOOR_SIZES = "(min-width: 768px) 22rem, 18rem"

/** Who the store is for, as a street: a painted name over each door, every one an example. */
export function Makers() {
  return (
    <section aria-labelledby="makers-title" className="surface-ink overflow-hidden pt-20 md:pt-32">
      <Container className="flex items-end justify-between gap-8">
        <h2 id="makers-title" className="max-w-4xl text-display-md">
          Made for goods that post well.
        </h2>
        <StreetControls targetId="street" className="hidden shrink-0 md:flex" />
      </Container>
      <ul
        id="street"
        tabIndex={0}
        aria-label="Example stores, one for each trade. Scroll sideways for more."
        className="mt-12 flex snap-x snap-mandatory scroll-pl-5 overflow-x-auto scroll-smooth px-5 [scrollbar-width:none] sm:scroll-pl-8 sm:px-8 lg:scroll-pl-[max(3rem,calc((100vw-84rem)/2+3rem))] lg:px-[max(3rem,calc((100vw-84rem)/2+3rem))]"
      >
        {shops.map((shop) => (
          <li key={shop.slug} className="w-72 shrink-0 snap-start border-x-4 border-paper/15 md:w-88">
            <div className={cn("flex h-24 flex-col items-center justify-center px-4 text-center", shop.board)}>
              <p className={cn("flex h-11 items-center leading-none whitespace-nowrap [font-variant-ligatures:none]", shop.lettering)}>{shop.name}</p>
              <p className="mt-1 font-mono text-[0.6875rem] leading-none">Example: {shop.trade.toLowerCase()}</p>
            </div>
            <TileEdge awning size={18} className="relative z-10 text-transparent" />
            <div className="relative -mt-[25px] aspect-[4/5] bg-muted">
              <MediaImage
                slug={shop.slug}
                fill
                sizes={DOOR_SIZES}
                className="object-cover"
                style={{ objectPosition: shop.position }}
              />
            </div>
          </li>
        ))}
      </ul>
      {/* The pavement the whole street stands on. */}
      <div className="border-t-4 border-paper/15 bg-ink py-4">
        <Container>
          <p className="text-xs text-muted-foreground">Example stores. Stock photographs.</p>
        </Container>
      </div>
    </section>
  )
}
