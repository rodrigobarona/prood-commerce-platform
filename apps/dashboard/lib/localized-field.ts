import { DEFAULT_LOCALE, type LocalizedField, type Maybe } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"

/**
 * The store shows one text per field, so a merchant edits one, in whatever
 * language they write. It's stored where the store reads it from, and any other
 * language set through the API stays beside it. Clearing the field clears them
 * too, or the store would fall back to one the merchant can't see.
 */
export function fieldText(field: Maybe<LocalizedField> | undefined): string {
  return localized(field)
}

/** The field with this text in it, or `undefined` if the text is empty. */
export function withFieldText(field: Maybe<LocalizedField> | undefined, text: string): LocalizedField | undefined {
  const next = text.trim()
  return next ? { ...field, [DEFAULT_LOCALE]: next } : undefined
}
