"use client"

import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"

export function CopyStoreLink({ url }: { url: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Store link copied.")
    } catch {
      toast.error(`We couldn't copy the link. Your store is at ${url}.`)
    }
  }

  return <Button onClick={copy}>Copy store link</Button>
}
