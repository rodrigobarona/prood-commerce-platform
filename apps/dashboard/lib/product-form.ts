/** The form's rule, and the API's: an active product needs a price above zero, a draft doesn't. */
export const PRICE_REQUIRED_MESSAGE = "Add a price above 0 to make this product active, or keep it as a draft."

export function priceError(values: { status: string; price: string }): string | null {
  return values.status === "active" && !(Number(values.price) > 0) ? PRICE_REQUIRED_MESSAGE : null
}

/** The old price only reads as a discount above the new one, so anything else is a slip. */
export function compareAtError(values: { price: string; compareAtPrice: string }): string | null {
  const compareAt = Number(values.compareAtPrice)
  if (!values.compareAtPrice.trim() || !Number.isFinite(compareAt)) return null
  return compareAt <= Number(values.price)
    ? "The old price has to be above the price, or customers won't see a discount. Raise it, or leave it empty."
    : null
}
