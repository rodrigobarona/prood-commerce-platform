"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Cart, CartItem, Product } from "@prood/types"
import { CartDrawer } from "@prood/ui/components/cart-drawer"
import { toast } from "sonner"

interface AddItemInput {
  productId: string
  variantId?: string
  quantity?: number
}

interface CartContextValue {
  cart: Cart | null
  itemCount: number
  loading: boolean
  openDrawer: () => void
  addItem: (input: AddItemInput) => Promise<void>
  addProduct: (product: Product, quantity?: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within <CartProvider>")
  return ctx
}

const API = "/api/commerce/cart"

function recalcTotals(items: CartItem[]): { itemCount: number; subtotal: number } {
  let itemCount = 0
  let subtotal = 0
  for (const item of items) {
    itemCount += item.quantity
    subtotal += item.totalPrice.amount
  }
  return { itemCount, subtotal }
}

function applyOptimisticUpdate(
  cart: Cart,
  itemId: string,
  quantity: number,
): Cart {
  const items = cart.items.map((item) => {
    if (item.id !== itemId) return item
    const unitAmount = item.price.amount
    return {
      ...item,
      quantity,
      totalPrice: { ...item.totalPrice, amount: unitAmount * quantity },
    }
  })
  const { itemCount, subtotal } = recalcTotals(items)
  return {
    ...cart,
    items,
    itemCount,
    totals: {
      ...cart.totals,
      subtotal: { ...cart.totals.subtotal, amount: subtotal },
      total: {
        ...cart.totals.total,
        amount:
          subtotal +
          (cart.totals.shipping?.amount ?? 0) +
          (cart.totals.tax?.amount ?? 0) -
          (cart.totals.discount?.amount ?? 0),
      },
    },
  }
}

function applyOptimisticRemove(cart: Cart, itemId: string): Cart {
  const items = cart.items.filter((item) => item.id !== itemId)
  const { itemCount, subtotal } = recalcTotals(items)
  return {
    ...cart,
    items,
    itemCount,
    totals: {
      ...cart.totals,
      subtotal: { ...cart.totals.subtotal, amount: subtotal },
      total: {
        ...cart.totals.total,
        amount:
          subtotal +
          (cart.totals.shipping?.amount ?? 0) +
          (cart.totals.tax?.amount ?? 0) -
          (cart.totals.discount?.amount ?? 0),
      },
    },
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const snapshotRef = useRef<Cart | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API)
      if (res.ok) {
        const data = (await res.json()) as { cart: Cart | null }
        setCart(data.cart)
      }
    } catch {
      // network blip — keep current state
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const mutate = useCallback(async (request: Promise<Response>) => {
    setLoading(true)
    try {
      const res = await request
      const data = (await res.json().catch(() => ({}))) as {
        cart?: Cart
        message?: string
      }
      if (!res.ok) throw new Error(data.message || "Something went wrong")
      if (data.cart) setCart(data.cart)
    } finally {
      setLoading(false)
    }
  }, [])

  const rollback = useCallback(() => {
    if (snapshotRef.current) {
      setCart(snapshotRef.current)
      snapshotRef.current = null
    }
  }, [])

  const addItem = useCallback(
    async (input: AddItemInput) => {
      try {
        await mutate(
          fetch(`${API}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1, ...input }),
          }),
        )
        setOpen(true)
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [mutate],
  )

  const addProduct = useCallback(
    (product: Product, quantity = 1) => addItem({ productId: product.id, quantity }),
    [addItem],
  )

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (cart) {
        snapshotRef.current = cart
        setCart(applyOptimisticUpdate(cart, itemId, quantity))
      }
      try {
        await mutate(
          fetch(`${API}/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          }),
        )
        snapshotRef.current = null
      } catch (err) {
        rollback()
        toast.error((err as Error).message)
      }
    },
    [cart, mutate, rollback],
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (cart) {
        snapshotRef.current = cart
        setCart(applyOptimisticRemove(cart, itemId))
      }
      try {
        await mutate(fetch(`${API}/items/${itemId}`, { method: "DELETE" }))
        snapshotRef.current = null
      } catch (err) {
        rollback()
        toast.error((err as Error).message)
      }
    },
    [cart, mutate, rollback],
  )

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        await mutate(
          fetch(`${API}/coupon`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }),
        )
        toast.success("Coupon applied")
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [mutate],
  )

  const removeCoupon = useCallback(async () => {
    try {
      await mutate(fetch(`${API}/coupon`, { method: "DELETE" }))
      toast.success("Coupon removed")
    } catch (err) {
      toast.error((err as Error).message)
    }
  }, [mutate])

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount ?? 0,
        loading,
        openDrawer: () => setOpen(true),
        addItem,
        addProduct,
        updateItem,
        removeItem,
        applyCoupon,
        removeCoupon,
        refresh,
      }}
    >
      {children}
      <CartDrawer
        open={open}
        onOpenChange={setOpen}
        cart={cart}
        loading={loading}
        onUpdateQuantity={updateItem}
        onRemove={removeItem}
      />
    </CartContext.Provider>
  )
}
