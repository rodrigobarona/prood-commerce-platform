"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { LocalizedField } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Switch } from "@prood/ui/components/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import {
  createProductAction,
  updateProductAction,
} from "@/app/(dashboard)/products/actions"
import {
  emptyLocalizedField,
  LocalizedFieldInput,
} from "@/components/store/localized-field-input"

export interface ProductFormValues {
  name: LocalizedField
  slug: string
  description: LocalizedField
  price: string
  compareAtPrice: string
  sku: string
  productType: string
  inStock: boolean
  requiresShipping: boolean
}

const PRODUCT_TYPES = ["physical", "digital", "service", "event"]

function toNumberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function trimLocalizedField(field: LocalizedField): LocalizedField | undefined {
  const trimmed: LocalizedField = {}
  for (const [key, value] of Object.entries(field)) {
    const next = value.trim()
    if (next) trimmed[key] = next
  }
  return Object.keys(trimmed).length > 0 ? trimmed : undefined
}

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string
  initial?: Partial<ProductFormValues>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name ?? emptyLocalizedField(),
    slug: initial?.slug ?? "",
    description: initial?.description ?? emptyLocalizedField(),
    price: initial?.price ?? "",
    compareAtPrice: initial?.compareAtPrice ?? "",
    sku: initial?.sku ?? "",
    productType: initial?.productType ?? "physical",
    inStock: initial?.inStock ?? true,
    requiresShipping: initial?.requiresShipping ?? true,
  })

  function set<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const payload = {
        name: values.name,
        slug: values.slug || undefined,
        description: trimLocalizedField(values.description),
        price: toNumberOrUndefined(values.price),
        compareAtPrice: toNumberOrUndefined(values.compareAtPrice),
        sku: values.sku || undefined,
        productType: values.productType,
        inStock: values.inStock,
        requiresShipping: values.requiresShipping,
      }
      try {
        if (productId) {
          await updateProductAction(productId, payload)
          toast.success("Product updated")
        } else {
          await createProductAction(payload)
          toast.success("Product created")
        }
        router.push("/products")
        router.refresh()
      } catch {
        toast.error("Could not save product")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LocalizedFieldInput
            label="Name"
            value={values.name}
            onChange={(name) => set("name", name)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="auto-generated if empty"
              value={values.slug}
              onChange={(event) => set("slug", event.target.value)}
            />
          </div>
          <LocalizedFieldInput
            label="Description"
            value={values.description}
            onChange={(description) => set("description", description)}
            multiline
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; inventory</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={values.price}
                onChange={(event) => set("price", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compareAtPrice">Compare-at price</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={values.compareAtPrice}
                onChange={(event) =>
                  set("compareAtPrice", event.target.value)
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={values.sku}
                onChange={(event) => set("sku", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productType">Type</Label>
              <Select
                value={values.productType}
                onValueChange={(value) => set("productType", value)}
              >
                <SelectTrigger id="productType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="inStock">In stock</Label>
            <Switch
              id="inStock"
              checked={values.inStock}
              onCheckedChange={(checked) => set("inStock", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="requiresShipping">Requires shipping</Label>
            <Switch
              id="requiresShipping"
              checked={values.requiresShipping}
              onCheckedChange={(checked) => set("requiresShipping", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : productId ? "Save changes" : "Create product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
