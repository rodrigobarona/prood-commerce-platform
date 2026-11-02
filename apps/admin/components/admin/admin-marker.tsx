/** Says this is the internal console, not the merchant dashboard. */
export function AdminMarker() {
  return (
    <span className="rounded-md border border-border px-1.5 font-mono text-xs/5 text-muted-foreground">
      Admin
    </span>
  )
}
