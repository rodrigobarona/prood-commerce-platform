import type { CSSProperties } from "react"
import { Geist_Mono, Inter, Newsreader } from "next/font/google"
import { cn } from "@prood/ui/lib/utils"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-family-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-family-mono" })
const fontHeading = Newsreader({ subsets: ["latin"], variable: "--font-store-heading", axes: ["opsz"] })

/** The store's type, for the `<html>` of every document it renders. */
export const fontClassName = cn("antialiased", fontSans.variable, fontMono.variable, fontHeading.variable, "font-sans")

// Set inline because the neutral theme defines this variable on `:root`, outside
// any layer, where a utility class can't override it.
export const headingFont = { "--font-family-heading": "var(--font-store-heading)" } as CSSProperties
