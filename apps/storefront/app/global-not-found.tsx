import "@prood/ui/globals.css"
import "@prood/ui/themes/neutral.css"
import { PageNotFound } from "@/components/layout/page-not-found"
import { fontClassName, headingFont } from "@/lib/fonts"

export const metadata = { title: "Page not found" }

/**
 * Paths no route claims, including the products and categories `proxy.ts`
 * found missing. Next.js answers them with a real 404 before rendering any
 * layout, which is also why this page can't show the store's header.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" style={headingFont} className={fontClassName}>
      <body className="flex min-h-svh flex-col">
        <main id="main-content" className="flex flex-1 flex-col">
          <PageNotFound />
        </main>
      </body>
    </html>
  )
}
