import type { Metadata } from "next"
import type { StoreInfo } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"

export function storeMetadata(store: Pick<StoreInfo, "name" | "description">): Metadata {
  const name = localized(store.name)
  return {
    title: { default: name, template: `%s · ${name}` },
    description: store.description ? localized(store.description) : undefined,
  }
}
