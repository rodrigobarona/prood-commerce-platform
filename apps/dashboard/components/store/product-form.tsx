"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { LocalizedField, Maybe, ProductType } from "@prood/types"
import { Input } from "@prood/ui/components/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@prood/ui/components/input-group"
import { Label } from "@prood/ui/components/label"
import { DetailLayout } from "@prood/ui/components/page-layout"
import { Panel } from "@prood/ui/components/panel"
import { SaveBar, useUnsavedChangesGuard } from "@prood/ui/components/save-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import { Switch } from "@prood/ui/components/switch"
import { Textarea } from "@prood/ui/components/textarea"
import {
  createProductAction,
  updateProductAction,
} from "@/app/(dashboard)/products/actions"
import { currencySymbol, humanize } from "@/lib/format"
import { withFieldText } from "@/lib/localized-field"
import { compareAtError, priceError } from "@/lib/product-form"

export interface ProductFormValues {
  name: string
  slug: string
  description: string
  price: string
  compareAtPrice: string
  sku: string
  productType: ProductType
  status: string
  inStock: boolean
  requiresShipping: boolean
}

const PRODUCT_TYPES = ["physical", "digital", "service", "event"]
const PRODUCT_STATUSES = ["draft", "active", "archived"]
/** Only digital changes anything by itself: it turns shipping off. */
const PRODUCT_TYPE_HINTS: Partial<Record<ProductType, string>> = {
  physical: "Something you post to the customer.",
  digital: "A file or a link. There's nothing to post, so shipping turns off.",
  service: "Work you do for the customer. Turn shipping off if nothing gets posted.",
  event: "A ticket or a place at an event. Turn shipping off if nothing gets posted.",
}
const NAME_REQUIRED_MESSAGE = "Give this product a name. It's what customers see on your store."

function toNumberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

/** A number field that reads as money: the store's symbol in front, and no spinner. */
function PriceInput({ symbol, ...props }: { symbol: string } & React.ComponentProps<"input">) {
  return (
    <InputGroup className="h-9">
      <InputGroupAddon>{symbol}</InputGroupAddon>
      <InputGroupInput
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...props}
      />
    </InputGroup>
  )
}

export function ProductForm({
  productId,
  currency,
  initial,
  source,
}: {
  productId?: string
  /** The store's currency, which every price is in. */
  currency: string
  initial?: Partial<ProductFormValues>
  /** What's stored for the text fields today, so saving keeps what the form doesn't show. */
  source?: { name?: Maybe<LocalizedField>; description?: Maybe<LocalizedField> }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [saved, setSaved] = useState<ProductFormValues>(() => ({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    compareAtPrice: initial?.compareAtPrice ?? "",
    sku: initial?.sku ?? "",
    productType: initial?.productType ?? "physical",
    status: initial?.status ?? "draft",
    inStock: initial?.inStock ?? true,
    requiresShipping: initial?.requiresShipping ?? initial?.productType !== "digital",
  }))
  const [values, setValues] = useState(saved)
  const [nameError, setNameError] = useState<string | null>(null)
  const [showPriceError, setShowPriceError] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)

  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  useUnsavedChangesGuard(dirty)
  const missingPrice = priceError(values)
  const symbol = currencySymbol(currency)

  function set<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const name = withFieldText(source?.name, values.name)
    setNameError(name ? null : NAME_REQUIRED_MESSAGE)
    setShowPriceError(Boolean(missingPrice))
    const badCompareAt = compareAtError(values)
    setCompareError(badCompareAt)
    const firstInvalid = !name ? "name" : missingPrice ? "price" : badCompareAt ? "compareAtPrice" : null
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    startTransition(async () => {
      const payload = {
        name: name as LocalizedField,
        slug: values.slug || undefined,
        description: withFieldText(source?.description, values.description) ?? {},
        price: toNumberOrUndefined(values.price),
        compareAtPrice: toNumberOrUndefined(values.compareAtPrice),
        sku: values.sku || undefined,
        productType: values.productType,
        status: values.status as "draft" | "active" | "archived",
        inStock: values.inStock,
        requiresShipping: values.requiresShipping,
      }
      try {
        const { error } = productId
          ? await updateProductAction(productId, payload)
          : await createProductAction(payload)
        if (error) {
          toast.error(error)
          return
        }
        // The router keeps this page alive behind the list, so it mustn't come back dirty.
        setSaved(values)
        toast.success(productId ? "Product saved." : "Product added.")
        router.push("/products")
        router.refresh()
      } catch {
        toast.error("We couldn't save this product. Nothing changed. Check the fields and try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <DetailLayout
        main={
          <>
            <Panel title="Details">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={nameError ? "name-error" : undefined}
                    value={values.name}
                    onChange={(event) => {
                      setNameError(null)
                      set("name", event.target.value)
                    }}
                  />
                  {nameError ? (
                    <p id="name-error" className="text-xs text-destructive">
                      {nameError}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={values.description}
                    onChange={(event) => set("description", event.target.value)}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Photos">
              <p className="text-sm text-muted-foreground">Photo upload: coming later.</p>
            </Panel>

            <Panel title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="price">Price</Label>
                  <PriceInput
                    id="price"
                    symbol={symbol}
                    aria-invalid={showPriceError && missingPrice ? true : undefined}
                    aria-describedby={showPriceError && missingPrice ? "price-error" : undefined}
                    value={values.price}
                    onChange={(event) => set("price", event.target.value)}
                  />
                  {showPriceError && missingPrice ? (
                    <p id="price-error" className="text-xs text-destructive">
                      {missingPrice}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="compareAtPrice">Compare-at price</Label>
                  <PriceInput
                    id="compareAtPrice"
                    symbol={symbol}
                    aria-invalid={compareError ? true : undefined}
                    aria-describedby={compareError ? "compareAtPrice-error" : "compareAtPrice-hint"}
                    value={values.compareAtPrice}
                    onChange={(event) => {
                      setCompareError(null)
                      set("compareAtPrice", event.target.value)
                    }}
                  />
                  {compareError ? (
                    <p id="compareAtPrice-error" className="text-xs text-destructive">
                      {compareError}
                    </p>
                  ) : null}
                  <p id="compareAtPrice-hint" className="text-xs text-muted-foreground">
                    The old price, shown crossed out next to the new one.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Advanced">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="slug">Web address</Label>
                  <Input
                    id="slug"
                    className="font-mono"
                    aria-describedby="slug-hint"
                    value={values.slug}
                    onChange={(event) => set("slug", event.target.value)}
                  />
                  <p id="slug-hint" className="text-xs text-muted-foreground">
                    The end of this product&apos;s link on your store. Leave it empty to make one from the name.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sku">Stock code (SKU)</Label>
                  <Input
                    id="sku"
                    className="font-mono"
                    aria-describedby="sku-hint"
                    value={values.sku}
                    onChange={(event) => set("sku", event.target.value)}
                  />
                  <p id="sku-hint" className="text-xs text-muted-foreground">
                    Your own code for this product, for your records. Leave it empty if you don&apos;t use one.
                  </p>
                </div>
              </div>
            </Panel>
          </>
        }
        aside={
          <>
            <Panel title="Status">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status" className="sr-only">
                  Status
                </Label>
                <Select value={values.status} onValueChange={(value) => set("status", value)}>
                  <SelectTrigger id="status" className="w-full data-[size=default]:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {humanize(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Customers only see active products, and active products need a price.
                </p>
              </div>
            </Panel>

            <Panel title="Inventory">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="inStock">In stock</Label>
                <Switch
                  id="inStock"
                  checked={values.inStock}
                  onCheckedChange={(checked) => set("inStock", checked)}
                />
              </div>
            </Panel>

            <Panel title="Type and shipping">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="productType">Type</Label>
                  <Select
                    value={values.productType}
                    onValueChange={(value) =>
                      setValues((prev) => ({
                        ...prev,
                        productType: value as ProductType,
                        requiresShipping: value !== "digital",
                      }))
                    }
                  >
                    <SelectTrigger
                      id="productType"
                      aria-describedby="productType-hint"
                      className="w-full data-[size=default]:h-9"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {humanize(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p id="productType-hint" className="text-xs text-muted-foreground">
                    {PRODUCT_TYPE_HINTS[values.productType]}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="requiresShipping">Requires shipping</Label>
                  <Switch
                    id="requiresShipping"
                    checked={values.requiresShipping}
                    onCheckedChange={(checked) => set("requiresShipping", checked)}
                  />
                </div>
              </div>
            </Panel>
          </>
        }
      />
      <SaveBar
        visible={!productId || dirty}
        pending={pending}
        message={productId ? undefined : values.status === "active" ? "This goes live when you add it." : "This saves as a draft."}
        saveLabel={productId ? "Save changes" : "Add product"}
        onDiscard={productId ? () => setValues(saved) : undefined}
      />
    </form>
  )
}
