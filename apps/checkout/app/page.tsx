import { StatusPanel } from "@/components/status-panel"

export default function HomePage() {
  return (
    <StatusPanel tone="neutral" title="No payment open">
      Go back to the store to check out. If you've placed an order, its page shows what's next.
    </StatusPanel>
  )
}
