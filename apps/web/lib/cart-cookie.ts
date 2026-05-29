import { cookies } from "next/headers"

const COOKIE = "commerce_cart_id"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function getCartId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null
}

export async function setCartId(id: string): Promise<void> {
  ;(await cookies()).set(COOKIE, id, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  })
}

export async function clearCartId(): Promise<void> {
  ;(await cookies()).delete(COOKIE)
}
