"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"

const OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price:asc", label: "Price, low to high" },
  { value: "price:desc", label: "Price, high to low" },
  { value: "createdAt:desc", label: "Newest" },
]

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <Select
      value={searchParams.get("sort") ?? "featured"}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams)
        params.delete("page")
        if (value === "featured") params.delete("sort")
        else params.set("sort", value)
        const query = params.toString()
        router.push(query ? `${pathname}?${query}` : pathname)
      }}
    >
      <SelectTrigger aria-label="Sort products" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
