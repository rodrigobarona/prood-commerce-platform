import { NextResponse } from "next/server"
import { z } from "zod"
import { createCheckoutSession } from "@workspace/checkout-host"
import { errorResponse, requireApiSecret } from "@/lib/api"

const createSchema = z.object({
  orderId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  providerId: z.string().optional(),
  customerInfo: z
    .object({
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  channel: z.enum(["web", "pos", "agent", "link"]).optional(),
  fulfillment: z.enum(["shipping", "local_delivery", "pickup", "none"]).optional(),
  expiresIn: z.number().positive().optional(),
})

export async function POST(request: Request) {
  try {
    requireApiSecret(request)
    const body = createSchema.parse(await request.json())
    const result = await createCheckoutSession(body)

    const hostedUrl = process.env.HOSTED_CHECKOUT_URL ?? "http://localhost:3100"
    return NextResponse.json({
      ...result,
      checkoutUrl: `${hostedUrl}/pay/${result.sessionId}`,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
