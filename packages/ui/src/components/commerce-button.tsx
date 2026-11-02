import type { ComponentProps } from "react"
import { Button } from "@prood/ui/components/button"
import { cn } from "@prood/ui/lib/utils"

/** The tall, square-cornered action of a storefront or hosted checkout. */
export function CommerceButton({ className, ...props }: Omit<ComponentProps<typeof Button>, "size">) {
  return <Button size="hero" className={cn("rounded-lg", className)} {...props} />
}
