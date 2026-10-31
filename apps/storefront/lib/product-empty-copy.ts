interface ProductListView {
  query?: string
  categoryId?: string
  /** Products matching the view across all pages. */
  total: number
}

/**
 * What to say when a page of the product list comes back empty. Undefined when
 * the store simply has no products, which is the grid's own empty state.
 */
export function productListEmptyCopy({ query, categoryId, total }: ProductListView) {
  if (query) {
    return {
      emptyTitle: `No results for "${query}"`,
      emptyDescription: "Check the spelling, or try a shorter search.",
    }
  }
  if (total > 0) {
    return {
      emptyTitle: "No more products",
      emptyDescription: "You've reached the end of this list.",
    }
  }
  if (categoryId) {
    return {
      emptyTitle: "No products in this category yet",
      emptyDescription: "Check back soon, or browse the rest of the store.",
    }
  }
  return undefined
}
