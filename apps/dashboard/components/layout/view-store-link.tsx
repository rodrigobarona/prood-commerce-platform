import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { getStoreUrl } from "@/lib/store-link"

export async function ViewStoreLink() {
  // A header link isn't worth failing every dashboard page over.
  const url = await getStoreUrl().catch(() => null)
  if (!url) return null

  return (
    <Button asChild variant="outline">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <span>View store</span>
        <ArrowSquareOut aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Button>
  )
}
