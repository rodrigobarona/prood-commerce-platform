import { NextResponse } from "next/server"
import { z } from "zod"
import { buildCheckoutSessionUrl, createCheckoutSession, resolveCheckoutBaseUrl } from "@prood/checkout-host"
import { errorResponse, requireApiSecret } from "@/lib/api"

const createSchema = z.object({
  orderId: z.string().optional(),
  customerId: z.string().min(1).optional(),
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
  tenantId: z.string().optional(),
  storeName: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    requireApiSecret(request)
    const body = createSchema.parse(await request.json())
    const result = await createCheckoutSession(body)

    return NextResponse.json({
      ...result,
      checkoutUrl: buildCheckoutSessionUrl(resolveCheckoutBaseUrl(), result.sessionId),
    })
  } catch (err) {
    return errorResponse(err)
  }
}
