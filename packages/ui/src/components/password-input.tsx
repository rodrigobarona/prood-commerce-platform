"use client"

import { useState, type ComponentProps } from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"

import { Input } from "@prood/ui/components/input"
import { cn } from "@prood/ui/lib/utils"

/** A password field with a show and hide switch, so a typo doesn't cost a failed sign-in. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeSlash : Eye

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-9", className)} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((shown) => !shown)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon aria-hidden className="size-4" />
      </button>
    </div>
  )
}
