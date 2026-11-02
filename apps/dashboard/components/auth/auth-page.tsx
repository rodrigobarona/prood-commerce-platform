import type { ReactNode } from "react"
import Link from "next/link"
import { MediaImage } from "@prood/media/image"
import { getImage } from "@prood/media"
import { AUTH_ASIDE_SIZES, AuthShell } from "@prood/ui/components/auth-shell"
import { Logo } from "@prood/ui/components/logo"

/**
 * Sign-in, sign-up and onboarding: the form on Paper beside a street or a
 * shopkeeper. The line over the photograph speaks for Prood, never for the
 * person in the frame, who isn't a customer.
 */
export function AuthPage({
  image,
  line,
  children,
}: {
  /** A slug from `packages/media/curation.json`. */
  image: string
  line: string
  children: ReactNode
}) {
  return (
    <AuthShell
      logo={
        <Link href="/" aria-label="Prood" className="inline-block">
          <Logo className="h-7" title={null} />
        </Link>
      }
      aside={
        <>
          <MediaImage
            slug={image}
            fill
            preload
            sizes={AUTH_ASIDE_SIZES}
            className="object-cover"
          />
          <div className="surface-ink surface-photo absolute inset-x-0 bottom-0 bg-transparent! bg-linear-to-t from-ink from-30% via-ink/80 to-transparent px-10 pt-40 pb-10">
            <p className="max-w-md font-heading text-2xl leading-tight font-medium tracking-[-0.02em] text-balance text-foreground">
              {line}
            </p>
            {getImage(image).tags.includes("people") ? (
              <p className="mt-2 text-xs text-foreground">Stock photo.</p>
            ) : null}
          </div>
        </>
      }
    >
      {children}
    </AuthShell>
  )
}
