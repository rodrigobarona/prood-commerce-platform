"use client"

import { createContext, use, useCallback, useState, type ReactNode } from "react"

interface CheckoutContextValue {
  storeName: string | null
  returnUrl: string | null
  /** A session page has said which store this is, or that it can't. */
  sessionRead: boolean
  setSession: (data: { storeName?: string | null; returnUrl?: string | null }) => void
}

const CheckoutContext = createContext<CheckoutContextValue>({
  storeName: null,
  returnUrl: null,
  sessionRead: false,
  setSession: () => {},
})

export function useCheckoutContext() {
  return use(CheckoutContext)
}

export function CheckoutContextProvider({ children }: { children: ReactNode }) {
  const [storeName, setStoreName] = useState<string | null>(null)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const [sessionRead, setSessionRead] = useState(false)

  const setSession = useCallback(
    (data: { storeName?: string | null; returnUrl?: string | null }) => {
      if (data.storeName !== undefined) setStoreName(data.storeName)
      if (data.returnUrl !== undefined) setReturnUrl(data.returnUrl)
      setSessionRead(true)
    },
    [],
  )

  return (
    <CheckoutContext value={{ storeName, returnUrl, sessionRead, setSession }}>
      {children}
    </CheckoutContext>
  )
}
