import { StatusPanel } from "@/components/status-panel"

export const metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <StatusPanel tone="neutral" title="We couldn't find that page">
      The link may be incomplete or out of date. Go back to the store to check out. If you've placed an order, its page
      shows what's next.
    </StatusPanel>
  )
}
