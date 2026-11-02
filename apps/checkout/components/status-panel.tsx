import type { ReactNode } from "react"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import {
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr"

const TONES = {
  success: { Icon: CheckCircleIcon, color: "text-success" },
  pending: { Icon: ClockIcon, color: "text-muted-foreground" },
  failed: { Icon: WarningCircleIcon, color: "text-destructive" },
  neutral: { Icon: InfoIcon, color: "text-muted-foreground" },
}

/**
 * A sentence for reaching the store, as specific as what the page knows. With
 * nothing known, the shopper's order email is the one thing that still leads
 * back to the store: every one of them links to it.
 */
export function StoreContact({ email, storeName }: { email?: string | null; storeName?: string | null }) {
  if (!email) {
    if (storeName) return <>Need help? Contact {storeName}.</>
    return (
      <>
        <span className="text-foreground">Find your order email.</span> It links to the store, so you can reach them
        there.
      </>
    )
  }
  return (
    <>
      Need help? Email{" "}
      <a href={`mailto:${email}`} className="text-foreground underline underline-offset-4">
        {email}
      </a>
    </>
  )
}

/**
 * A finished payment always leads somewhere: back to the store when there's a
 * link, then to the store's inbox, then to what the page still knows.
 */
export function onwardProps(
  link: ReactNode,
  store: { email?: string | null; name?: string | null; orderNumber?: string | null },
): { action?: ReactNode; contact?: ReactNode } {
  if (link) return { action: link }
  if (!store.email) return { contact: <StoreContact storeName={store.name} /> }
  const subject = store.orderNumber ? `?subject=${encodeURIComponent(`Order #${store.orderNumber}`)}` : ""
  return {
    action: (
      <CommerceButton asChild variant="outline">
        <a href={`mailto:${store.email}${subject}`}>Email the store</a>
      </CommerceButton>
    ),
  }
}

/** Where a payment stands, when that's the whole of the page. */
export function StatusPanel({
  tone,
  title,
  details,
  action,
  contact,
  children,
}: {
  tone: keyof typeof TONES
  title: string
  /** More to say than one line can hold. */
  details?: ReactNode
  action?: ReactNode
  /** The way to a person, under everything else. */
  contact?: ReactNode
  children: ReactNode
}) {
  const { Icon, color } = TONES[tone]

  return (
    <div className="flex flex-col gap-3">
      <Icon size={32} weight="fill" className={color} />
      <h1 data-step-heading tabIndex={-1} className="text-display-sm text-balance outline-none">
        {title}
      </h1>
      <p className="text-muted-foreground">{children}</p>
      {details ? <div className="mt-3">{details}</div> : null}
      {action ? <div className="mt-3 flex flex-col gap-2">{action}</div> : null}
      {contact ? <p className="text-muted-foreground mt-1 text-sm">{contact}</p> : null}
    </div>
  )
}
