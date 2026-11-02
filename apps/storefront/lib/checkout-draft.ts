import type { AddressValues, ContactValues } from "@/components/checkout/schemas"

const KEY = "prood-checkout"

/** What a shopper typed, kept for this tab so a reload doesn't lose it. No payment data passes here. */
export interface CheckoutDraft {
  contact?: Partial<ContactValues>
  address?: Partial<AddressValues>
  step?: number
}

export function readDraft(): CheckoutDraft {
  if (typeof sessionStorage === "undefined") return {}
  try {
    return (JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as CheckoutDraft | null) ?? {}
  } catch {
    return {}
  }
}

export function saveDraft(change: CheckoutDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...readDraft(), ...change }))
  } catch {
    // Private mode or a full quota: the form still works, it just won't survive a reload.
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing was saved, then.
  }
}
