"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Cart, Product } from "@workspace/commerce/types"
import { CartDrawer } from "@workspace/ui/components/cart-drawer"
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
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within <CartProvider>")
  return ctx
}

const API = "/api/commerce/cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

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
      try {
        await mutate(
          fetch(`${API}/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          }),
        )
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [mutate],
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        await mutate(fetch(`${API}/items/${itemId}`, { method: "DELETE" }))
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [mutate],
  )

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
