import { Abril_Fatface, Alfa_Slab_One, Cinzel, Limelight, Oleo_Script, Stardos_Stencil } from "next/font/google"

/**
 * The street's painted signs are pictures of signs, so each has its own hand.
 * These faces are for the example signs in `Makers` and nowhere else: they load
 * only with that section, and never preload.
 */
export const deco = Limelight({ weight: "400", subsets: ["latin"], preload: false })
export const script = Oleo_Script({ weight: "400", subsets: ["latin"], preload: false })
export const slab = Alfa_Slab_One({ weight: "400", subsets: ["latin"], preload: false })
export const gilded = Cinzel({ weight: "600", subsets: ["latin"], preload: false })
export const fatface = Abril_Fatface({ weight: "400", subsets: ["latin"], preload: false })
export const stencil = Stardos_Stencil({ weight: "700", subsets: ["latin"], preload: false })
