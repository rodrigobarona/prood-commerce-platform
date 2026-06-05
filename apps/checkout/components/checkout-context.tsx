"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

interface CheckoutContextValue {
  storeName: string | null
  returnUrl: string | null
  setSession: (data: { storeName?: string | null; returnUrl?: string | null }) => void
}

const CheckoutContext = createContext<CheckoutContextValue>({
  storeName: null,
  returnUrl: null,
  setSession: () => {},
})

export function useCheckoutContext() {
  return useContext(CheckoutContext)
}

export function CheckoutContextProvider({ children }: { children: ReactNode }) {
  const [storeName, setStoreName] = useState<string | null>(null)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  const setSession = useCallback(
    (data: { storeName?: string | null; returnUrl?: string | null }) => {
      if (data.storeName !== undefined) setStoreName(data.storeName)
      if (data.returnUrl !== undefined) setReturnUrl(data.returnUrl)
    },
    [],
  )

  return (
    <CheckoutContext.Provider value={{ storeName, returnUrl, setSession }}>
      {children}
    </CheckoutContext.Provider>
  )
}
