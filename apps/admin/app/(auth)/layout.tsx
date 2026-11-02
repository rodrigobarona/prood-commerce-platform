import { AUTH_ASIDE_SIZES, AuthShell } from "@prood/ui/components/auth-shell"
import { Logo } from "@prood/ui/components/logo"
import { MediaImage } from "@prood/media/image"
import { AdminMarker } from "@/components/admin/admin-marker"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthShell
      logo={
        <div className="flex items-center gap-3">
          <Logo className="h-7" />
          <AdminMarker />
        </div>
      }
      aside={
        <MediaImage
          slug="keys-door"
          fill
          sizes={AUTH_ASIDE_SIZES}
          className="object-cover"
        />
      }
      footer="Internal tool. Every sign-in is recorded as a session."
    >
      {children}
    </AuthShell>
  )
}
