"use client"

import {
  createContext,
  useCallback,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Cart, CartItem, PaymentMethodKind, Product } from "@prood/types"
import { CartDrawer } from "@prood/ui/components/cart-drawer"
import { paymentNote } from "@prood/ui/lib/commerce"
import { toast } from "sonner"
import { latestOnly } from "@/lib/latest-only"
import { STORE_CLOSED_MESSAGE, canCheckOut } from "@/lib/store-status"

interface AddItemInput {
  productId: string
  variantId?: string
  quantity?: number
}

interface CartContextValue {
  cart: Cart | null
  canTakeOrders: boolean
  /** How the store takes payment, in a sentence, when that's known. */
  paymentNote: string | null
  itemCount: number
  loading: boolean
  hydrating: boolean
  openDrawer: () => void
  /** Resolves to whether the item was added; a refusal is shown as a toast. */
  addItem: (input: AddItemInput) => Promise<boolean>
  addProduct: (product: Product, quantity?: number) => Promise<boolean>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  /** Rejects if the cart couldn't be updated, so checkout can stop and say so. */
  setShippingMethod: (methodId: string) => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = use(CartContext)
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

export function CartProvider({
  canTakeOrders,
  paymentMethods = [],
  children,
}: {
  canTakeOrders: boolean
  paymentMethods?: PaymentMethodKind[]
  children: ReactNode
}) {
  const payment = paymentNote(paymentMethods)
  const [cart, setCart] = useState<Cart | null>(null)
  const [pending, setPending] = useState(0)
  const [hydrating, setHydrating] = useState(true)
  const [open, setOpen] = useState(false)
  // Quick clicks overlap: a failure goes back to what the server last said,
  // and only the newest response may replace what the shopper sees.
  const confirmedRef = useRef<Cart | null>(null)
  const latestRef = useRef(0)
  const loading = pending > 0
  const returnFocusRef = useRef<Element | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(API)
      if (res.ok) {
        const data = (await res.json()) as { cart: Cart | null }
        confirmedRef.current = data.cart
        setCart(data.cart)
      }
    } catch {
      // network blip — keep current state
    } finally {
      setHydrating(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  const mutate = useCallback(async (request: Promise<Response>) => {
    const id = ++latestRef.current
    setPending((count) => count + 1)
    try {
      const res = await request
      const data = (await res.json().catch(() => ({}))) as {
        cart?: Cart
        message?: string
      }
      if (!res.ok) throw new Error(data.message || "Something went wrong")
      if (data.cart) {
        confirmedRef.current = data.cart
        if (id === latestRef.current) setCart(data.cart)
      }
    } catch (err) {
      if (id === latestRef.current) setCart(confirmedRef.current)
      throw err
    } finally {
      setPending((count) => count - 1)
    }
  }, [])

  const addItem = useCallback(
    async (input: AddItemInput) => {
      // Before the button disables itself and gives up focus.
      returnFocusRef.current = document.activeElement
      try {
        await mutate(
          fetch(`${API}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1, ...input }),
          }),
        )
        setOpen(true)
        return true
      } catch (err) {
        toast.error((err as Error).message)
        return false
      }
    },
    [mutate],
  )

  const addProduct = useCallback(
    (product: Product, quantity = 1) =>
      addItem({ productId: product.id, variantId: product.variants[0]?.id, quantity }),
    [addItem],
  )

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      setCart((current) => current && applyOptimisticUpdate(current, itemId, quantity))
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
      setCart((current) => current && applyOptimisticRemove(current, itemId))
      try {
        await mutate(fetch(`${API}/items/${itemId}`, { method: "DELETE" }))
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [mutate],
  )

  const shippingQueueRef = useRef<((methodId: string) => Promise<void>) | null>(null)
  const setShippingMethod = useCallback(
    (methodId: string) => {
      shippingQueueRef.current ??= latestOnly((id: string) =>
        mutate(
          fetch(`${API}/shipping-method`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ methodId: id }),
          }),
        ),
      )
      return shippingQueueRef.current(methodId)
    },
    [mutate],
  )

  const openDrawer = useCallback(() => {
    returnFocusRef.current = document.activeElement
    setOpen(true)
  }, [])

  // Nothing here is the sheet's own trigger, so it can't find its way back alone.
  const returnFocus = useCallback(() => {
    const opener = returnFocusRef.current
    const target =
      opener instanceof HTMLElement && opener !== document.body && opener.isConnected && !opener.matches(":disabled")
        ? opener
        : document.querySelector<HTMLElement>("[data-cart-trigger]")
    target?.focus()
  }, [])

  return (
    <CartContext
      value={{
        cart,
        canTakeOrders,
        paymentNote: payment,
        itemCount: cart?.itemCount ?? 0,
        loading,
        hydrating,
        openDrawer,
        addItem,
        addProduct,
        updateItem,
        removeItem,
        setShippingMethod,
        refresh,
      }}
    >
      {children}
      <CartDrawer
        open={open}
        onOpenChange={setOpen}
        onCloseAutoFocus={returnFocus}
        cart={cart}
        loading={loading}
        checkoutDisabledReason={canCheckOut(canTakeOrders, cart) ? undefined : STORE_CLOSED_MESSAGE}
        paymentNote={payment}
        onUpdateQuantity={updateItem}
        onRemove={removeItem}
      />
    </CartContext>
  )
}
