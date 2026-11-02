# Prood design system

One design system for every Prood surface: marketing (`apps/web`), dashboard (`apps/dashboard`), admin (`apps/admin`), docs (`apps/docs`), storefront (`apps/storefront`) and hosted checkout (`apps/checkout`). Tokens and components live in this package, photography and film in `@prood/media`. The living reference is `/design` on the marketing site. `_docs/BRAND.md` covers positioning, voice and logo; this file covers how things are built.

## The idea: the shopfront

The store before the software. Everything hangs on three physical things from a shop on a Portuguese street:

- **Receipt paper:** Paper, the warm canvas, and the `Receipt`, the signature product fragment, used as a system: the sale in the hero, plans as till slips, the agency ledger, the Multibanco reference, the closing slip made out for each page. On the home page the zero fee sits on the hero, plan and closing slips, and anywhere else it's bare type. The home page's key tags are cut from the same paper.
- **The roof tile:** Telha, the one signal color. The logo's mark is one tile off the eave, and `TileEdge` and `TileField` are the eave itself: filled tiles from the wordmark's ring that always hang downward, like an awning.
- **The people behind the counter:** real hands and faces in natural light. Every photograph carries one shared grade.

Shopify's scale and human film are the benchmark. The materials are what make it Prood's and nobody else's.

## Principles

1. **People first on marketing, data first in product.** A marketing page opens with a person, a place or one of the brand's own objects. `/integrations` opens on the key and `/developers` on a key tag, so the inner pages don't share one skeleton. A dashboard page opens with the merchant's work.
2. **One loud thing per view.** One Telha fill, one display headline, one full-bleed image. Everything else is quiet.
3. **Show the real thing.** Product visuals use real components where they can and are simplified by hand where they can't, always with sample data and a label that says so.
4. **Only claim what ships.** Follow "What we may claim" in `_docs/BRAND.md`. Examples are labeled as examples. No invented customers, logos, quotes or metrics.
5. **Accessible by default.** WCAG 2.2 AA, visible focus, keyboard reachable, no meaning in color alone, motion can be paused.

## Surfaces

A surface is a class that restyles the tokens inside it, so most components carry over. Button keeps `paper` and `on-photo` variants for photographs.

| Surface | Use |
| --- | --- |
| Page (default) | Paper in light, Ink in dark |
| `surface-ink` | Fixed Ink panel in either scheme. Turns on Tailwind's `dark:` variant inside it |
| `surface-telha` | Fixed Telha panel, on the true token. At most one per page, usually the closing call to action |
| `surface-photo` | Add to `surface-ink` when text sits directly on a photograph. `brand` becomes the true Telha with Paper on it |
| `surface-paper` | Receipt paper. Light tokens in either scheme, for controls on a `Receipt`, which sets it for you |

Fixed colors for use inside components: `ink`, `paper`, `telha`. `--page` is the page's own background, for an edge hanging from it over a surface. `--closing-edge` and `--footer-edge` override the color of the edge over the closing section and the footer: `globals.css` in `apps/web` sets them from whatever sits above. Never hardcode `oklch()` or hex in apps.

## Type

| Utility | Use |
| --- | --- |
| `text-display-xl` | The home hero only |
| `text-display-lg` | Inner page heroes, closing calls to action |
| `text-display-md` | Section titles |
| `text-display-sm` | Card titles, big facts |
| `text-lead` | The paragraph under a display heading |
| `text-eyebrow` | Mono, uppercase, above a title |

Display sizes track from -0.016em to -0.006em with common ligatures off, and `text-display-lg` and `-md` hold Bricolage at `opsz` 48, so "of" stays open. Bricolage still joins "ff" and clips the dot of "fi" at display size, and its "f" sits badly in "fr" and at the end of a word, so reword a display headline that contains them. Break display headlines between sentences, with a `block` span for each. Marketing and storefront heroes use the display scale. Product UI does not: page titles are `font-heading text-2xl font-medium` through `PageHeader`, panel titles `text-sm font-semibold`, body `text-sm`. Numbers in tables use `tabular-nums`. Identifiers (order numbers, keys, domains) use `font-mono`.

## Shape and space

- Radius: controls `rounded-lg`, cards and panels `rounded-xl`, large marketing frames `rounded-3xl`, pills only for `hero` buttons, status and segmented controls.
- Controls: inputs `h-9`, buttons `h-8` by default, `lg` for page-level actions, `hero` for marketing.
- Borders over shadows in product UI. Shadows are for floating layers.
- Marketing: container `max-w-[84rem]`, sections `py-20 md:py-32`.
- Product: content `max-w-6xl`, forms `max-w-2xl`, `gap-6` between blocks, `gap-3` inside a grid of cards.
- Every page works at 360 px. Tables scroll inside their own border.

## Components

| Need | Use |
| --- | --- |
| Page title and primary action | `PageHeader` (`components/page-header`) |
| Headline numbers | `StatGrid`, `Stat`. Pass `href` on an overview, so each number opens its list |
| Status of an order, domain, provider | `Status` with a look from a status map, or `StatusBadge`. Tones: `neutral`, `brand`, `success`, `warning`, `danger`, `info` |
| Bordered block around a table, list or form | `Panel`; pass `flush` for tables |
| Sign-in, sign-up, onboarding | `AuthShell`, with a `MediaImage` as `aside` |
| Empty list inside a `Panel` | `PanelEmpty`, in the shape from `_docs/BRAND.md` (what will appear, why, one action) |
| Whole-page empty, on merchant surfaces | `EmptyState`, which uses the display scale |
| Label and value pairs on detail pages | `FactList` |
| Search, status tabs, sorting and pagination on a list | `ListToolbar`, `SortableHead`, `ListPagination`, read with `readListState` from `lib/list-params`. Everything lives in the URL. Only sort or count what the server can. Pass `sorts` to `ListToolbar` wherever a sortable column folds away, so phones keep the sort |
| A table in a flush `Panel` | `ListTable`, `RowLink`. Fold secondary columns into two-line rows with `hidden @2xl:table-cell` and `@2xl:hidden`. A table with many columns or a row action folds later, at `@3xl` or `@4xl`: use `FOLD_CELL_3XL` or `FOLD_CELL_4XL`, and pass the same width to `ListToolbar` as `foldsAt` |
| Save on a short form | `footer` on its `Panel`, one per form. Editing: disabled until something changed. Creating: always enabled, and errors show beside the fields on submit |
| Save on a long form | `SaveBar`, as the form's last child, with `useUnsavedChangesGuard`, and `useFocusReturn` if the form stays on the page after saving |
| Anything hard to undo | `ConfirmAction`, inside a `DangerZone` at the bottom of the page. Row actions are quiet icon buttons |
| A value to copy elsewhere | `CopyBlock`, or `CopyValue` for an ID in a `Fact` |
| Long lists to choose from | `SearchSelect` |
| Password fields | `PasswordInput` |
| Layout of a product page | `PageStack`, `DetailLayout`, `BackLink` (`components/page-layout`) |
| Sale, payment or order moment on marketing | `Receipt`. On the home hero it's punched at the corner, and the key hangs from it |
| Brand's key | `KeyMark`, `hanging` on a key board, flat elsewhere, `cut` at poster size: a short shank, one groove, stepped teeth. Only where the subject is keys or access |
| One owned object on an inner hero | `object` on `PageHero`, crossing the seam: a plan slip, the ledger, a key tag |
| One owned moment in the middle of an inner page | `/developers` has the `KeyLedger`, sticky beside the scopes it lists. `/integrations` has the `MoneyPath`, one drawn string from customer to till slip. Don't reuse either on another page |
| Section seams | `TileEdge`, colored with the section above. Under a photograph or film pass `awning` and color it with the section below, so a Telha awning hangs over that section |
| A table or list that scrolls sideways | `scroll-cue` on the scrolling element, on a card, the same soft edge as a docs code block. `ListTable` sets it for you. On a street of doors, `StreetControls` gives a wide screen previous and next |
| Behind Ink and Telha panels | `TileField`, filled courses, at low contrast |
| Real product on marketing | `BrowserFrame`, `PhoneFrame` around real components |
| Photographs | `MediaImage` from `@prood/media/image`. On a `PageHero`, pass `inset` to hold the subject clear of the headline, and `positionMobile` for the tall crop |
| Film | `MediaVideo` from `@prood/media/video`, a server component that keeps the library out of the client bundle. It includes the pause control |

Every call to action is a `Button` (`asChild` with a link). Inputs, selects and textareas come from this package. No ad-hoc class strings on raw elements.

Button variants: `default` is the action in product UI. `brand` is the single Telha action in a view. `paper` and `on-photo` sit on photographs and Ink.

## Product UI

- Every page starts with `PageHeader`. One primary action, top right.
- Lists are a `Panel flush` around a `ListTable`, with one state column and a useful empty state. `StatusBadge` is quiet by default. `filled`, or `needsAction` on a look, is only for where someone has to act: Pending, Past due, Revoked agents, To fulfill. Roles are plain text.
- Detail pages use a two-column layout at `lg`: the work on the left, the facts on the right.
- Telha marks active navigation, focus and the one main action. It never means error.
- Quiet by default: no decorative images, gradients or tile motifs inside dashboard and admin pages. Photography belongs on sign-in and first-run moments.

## Merchant surfaces

Storefront and hosted checkout use this same system (layout, type scale, components, spacing, motion) on the neutral theme, `@prood/ui/themes/neutral.css`, with Newsreader for headings. The merchant's brand is what shows: no Telha, no Prood logo, no tile motifs. The Prood name appears only as a small "Powered by Prood" line.

## Photography and film

Curated in `packages/media/curation.json`; `pnpm --filter @prood/media media:build` fetches from Pexels, applies the Prood grade and uploads to R2.

- **Subjects:** independent shopkeepers and makers, people working rather than posing, hands at work, parcels, doors, keys, street fronts, tiles. Natural light. Portugal and southern Europe first.
- **Never:** suits in glass offices, handshakes, people pointing at laptops, code on screens, screens with invented dashboards, card terminals (Prood is online), visible third-party logos. That covers shop signs, packaging, utility plates and reflections: check every frame at full size, and use a `crop` in `curation.json` or replace it.
- **The grade:** one warm, slightly matte light: lifted blacks, rolled-off highlights, saturated outliers compressed, skin left natural. Defined once in `packages/media/scripts/grade.mjs`; film uses a LUT baked from the same function. Never add a photo without it.
- **The film:** one shop day as a loop, from the lock turning, straight to hands at work, to a parcel handed over at a door. No shop signs on film: the door photograph under the hero owns the opening moment. On wide screens it runs in the right of the hero and fades into Ink. The poster is the copper key in the lock, the film's first frame: warm, close and calm. `posterAt` on the key clip in `curation.json` picks it, only one clip carries it, and the build renders it from the source, not from the encoded film. `soften` on that clip takes the source's sharpening out. Set each clip's `focus` so the tall cut stays on the subject, and `tallCrop` when the two cuts need different framing. The tall cut sits on the bottom of its frame. Check both cuts: no subject may run into the headline or hide behind the receipt.
- **Casting:** one subject, working, not looking at the camera. No posed couples or groups with no subject on a hero. Vary trades and people on a page: never the same person or studio twice.
- **Honesty:** people in photographs are not customers. Show trades, not testimonials, and never put a name or a quote on a face. Pexels' licence forbids implying endorsement. Example store names go over hands and goods only, each one labelled as an example, like the signs on the home page's street. Faces in a row or next to a claim carry a visible "Stock photographs. Not Prood customers." (`StockNote`; the hero says "Stock film." in its small print), at most once per section. `/credits` thanks everyone and covers Prood's sites and apps.
- **Alt text** says what's in the frame. Photographs behind display text keep their alt; pure texture is `decorative`.

## Motion

Motion explains, it doesn't decorate. 120 ms for hover and press, 200 ms for menus and disclosure, 320 ms for panels, `ease-standard` to enter and `ease-exit` to leave. Opacity and transform only. Content is visible on first paint. `prefers-reduced-motion` removes it all, and the film falls back to its poster.
