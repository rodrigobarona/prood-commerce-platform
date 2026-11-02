"use client"

import type { ReactNode } from "react"
import { Toaster } from "@prood/ui/components/sonner"
import { ThemeProvider } from "@prood/ui/components/theme-provider"

/** What dashboard and admin wrap every page in. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  )
}
