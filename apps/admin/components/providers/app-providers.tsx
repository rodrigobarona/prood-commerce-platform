"use client"

import type { ReactNode } from "react"
import { Toaster } from "@prood/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  )
}
