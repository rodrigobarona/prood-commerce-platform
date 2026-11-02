import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** Teach tailwind-merge the display scale, or it mistakes these for text colors. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-display-xl", "text-display-lg", "text-display-md", "text-display-sm", "text-lead", "text-eyebrow"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
