import { NextResponse } from "next/server"
import { z } from "zod"
import { createPaymentLink } from "@workspace/checkout-host"
import { errorResponse, requireApiSecret } from "@/lib/api"

const linkSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  orderId: z.string().optional(),
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
  expiresIn: z.number().positive().optional(),
})

export async function POST(request: Request) {
  try {
    requireApiSecret(request)
    const body = linkSchema.parse(await request.json())
    const result = await createPaymentLink(body)

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
      providerId: result.providerId,
      publishableKey: result.publishableKey,
      ...result.snapshot,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
