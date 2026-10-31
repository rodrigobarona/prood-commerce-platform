// ---------------------------------------------------------------------------
// Coupons — whether a code applies, what it takes off, and redeeming it
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Maybe, Promotion, PromotionCondition } from '@prood/types'
import type { coupons, promotions } from '../database/drizzle/schema/promotions.js'
import {
  countOrdersByShopper,
  decrementCouponUsage,
  findCouponByCode,
  findProductCategoryIds,
  findPromotionById,
  incrementCouponUsage,
  lockCouponByCode,
} from '../database/index.js'
import { priceRequired, normalizeLocalizedField, roundMoney, toNumber } from './helpers.js'

type CouponRow = typeof coupons.$inferSelect

/** A cart or order being priced: amounts in major units of the store's currency. */
export interface CouponContext {
  lines: { productId: string; quantity: number; totalPrice: number }[]
  subtotal: number
  shipping: number
  currency: string
  customerId?: Maybe<string>
  contactEmail?: Maybe<string>
}

export type CouponProblem =
  | 'unknown'
  | 'disabled'
  | 'not_started'
  | 'expired'
  | 'usage_limit_reached'
  | 'customer_limit_reached'
  | 'first_order_only'
  | 'customer_required'
  | 'minimum_not_met'
  | 'no_eligible_items'
  | 'not_supported'

const NO_CONDITIONS: PromotionCondition = {
  minPurchaseAmount: null,
  minItemCount: null,
  productIds: null,
  categoryIds: null,
  firstOrderOnly: false,
}

export function mapPromotion(row: typeof promotions.$inferSelect, storeCurrency: string): Promotion {
  const conditions: PromotionCondition = {
    ...NO_CONDITIONS,
    ...(row.conditionsJson ? JSON.parse(row.conditionsJson) : null),
  }

  return {
    id: row.id,
    name: normalizeLocalizedField(row.name),
    description: row.description ? normalizeLocalizedField(row.description) : null,
    discountType: row.discountType as Promotion['discountType'],
    discountValue: toNumber(row.discountValue),
    currency: row.currency,
    maxDiscount: row.maxDiscount ? priceRequired(row.maxDiscount, row.currency ?? storeCurrency) : null,
    target: row.target as Promotion['target'],
    conditions,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    isActive: row.isActive,
    requiresCoupon: row.requiresCoupon,
    usageLimitPerCustomer: row.usageLimitPerCustomer,
    usageLimitTotal: row.usageLimitTotal,
  }
}

/** Whether the engine can compute this promotion in the store's currency. */
function isSupported(promotion: Promotion, currency: string): boolean {
  // buy_x_get_y and bundle have no quantities in the schema to compute from,
  // and a customer target has no segment to match.
  const computable =
    ['percentage', 'fixed_amount', 'free_shipping'].includes(promotion.discountType) &&
    promotion.target !== 'customer'
  const currencies = [promotion.currency, promotion.conditions.minPurchaseAmount?.currency]
  return computable && currencies.every(c => c == null || c === currency)
}

/** What rules a coupon out whatever it is used on. */
export function couponStateProblem(
  coupon: CouponRow,
  promotion: Promotion,
  currency: string,
  now = new Date(),
): CouponProblem | null {
  if (!coupon.isValid || !promotion.isActive) return 'disabled'
  if (!isSupported(promotion, currency)) return 'not_supported'
  if (now < new Date(promotion.startsAt)) return 'not_started'
  if (promotion.endsAt && now >= new Date(promotion.endsAt)) return 'expired'
  if (promotion.usageLimitTotal != null && coupon.timesUsed >= promotion.usageLimitTotal) {
    return 'usage_limit_reached'
  }
  return null
}

async function eligibleLines(promotion: Promotion, context: CouponContext) {
  const { productIds, categoryIds } = promotion.conditions
  if (!productIds?.length && !categoryIds?.length) return context.lines

  const eligible: CouponContext['lines'] = []
  for (const line of context.lines) {
    const categories = categoryIds?.length ? await findProductCategoryIds(line.productId) : []
    if (productIds?.includes(line.productId) || categories.some(id => categoryIds?.includes(id))) {
      eligible.push(line)
    }
  }
  return eligible
}

async function shopperProblem(
  promotion: Promotion,
  code: string,
  context: CouponContext,
  redeeming: boolean,
): Promise<CouponProblem | null> {
  const { usageLimitPerCustomer, conditions } = promotion
  if (usageLimitPerCustomer == null && !conditions.firstOrderOnly) return null

  // A cart may not know its shopper yet; an order must.
  if (!context.customerId && !context.contactEmail) return redeeming ? 'customer_required' : null

  if (conditions.firstOrderOnly && (await countOrdersByShopper(context)) > 0) {
    return 'first_order_only'
  }
  if (usageLimitPerCustomer != null && (await countOrdersByShopper(context, code)) >= usageLimitPerCustomer) {
    return 'customer_limit_reached'
  }
  return null
}

function discountOn(promotion: Promotion, eligibleTotal: number, context: CouponContext): number {
  if (promotion.discountType === 'free_shipping') return context.shipping

  const base = promotion.target === 'shipping'
    ? context.shipping
    : promotion.target === 'order' ? context.subtotal : eligibleTotal

  const amount = promotion.discountType === 'percentage'
    ? Math.min((base * promotion.discountValue) / 100, promotion.maxDiscount?.amount ?? Infinity)
    : promotion.discountValue
  return roundMoney(Math.min(amount, base))
}

type Assessment = { discount: number; problem: null } | { discount: 0; problem: CouponProblem }

function rejected(problem: CouponProblem): Assessment {
  return { discount: 0, problem }
}

async function assess(
  coupon: Maybe<CouponRow>,
  context: CouponContext,
  redeeming: boolean,
): Promise<Assessment> {
  const promotionRow = coupon ? await findPromotionById(coupon.promotionId) : null
  if (!coupon || !promotionRow) return rejected('unknown')

  const promotion = mapPromotion(promotionRow, context.currency)
  const stateProblem = couponStateProblem(coupon, promotion, context.currency)
  if (stateProblem) return rejected(stateProblem)

  const { minPurchaseAmount, minItemCount } = promotion.conditions
  const itemCount = context.lines.reduce((sum, line) => sum + line.quantity, 0)
  if (minPurchaseAmount && context.subtotal < minPurchaseAmount.amount) return rejected('minimum_not_met')
  if (minItemCount != null && itemCount < minItemCount) return rejected('minimum_not_met')

  const eligible = await eligibleLines(promotion, context)
  const restricted = promotion.conditions.productIds?.length || promotion.conditions.categoryIds?.length
  if (restricted && eligible.length === 0) return rejected('no_eligible_items')

  const shopper = await shopperProblem(promotion, coupon.code, context, redeeming)
  if (shopper) return rejected(shopper)

  const eligibleTotal = eligible.reduce((sum, line) => sum + line.totalPrice, 0)
  return { discount: discountOn(promotion, eligibleTotal, context), problem: null }
}

const MESSAGES: Record<CouponProblem, string> = {
  unknown: 'is not valid',
  disabled: 'is no longer valid',
  not_started: 'is not active yet',
  expired: 'has expired',
  usage_limit_reached: 'has been fully redeemed',
  customer_limit_reached: 'has already been used',
  first_order_only: 'is for first orders only',
  customer_required: 'needs a customer or contact email',
  minimum_not_met: 'needs a larger order',
  no_eligible_items: 'does not apply to these items',
  not_supported: 'cannot be used in this store',
}

function couponMessage(code: string, problem: CouponProblem): string {
  return `Coupon ${code} ${MESSAGES[problem]}.`
}

/** What a coupon would take off a cart, or why it takes nothing. */
export async function previewCoupon(
  code: string,
  context: CouponContext,
): Promise<{ discount: number; problem: Maybe<string> }> {
  const { discount, problem } = await assess(await findCouponByCode(code), context, false)
  return { discount, problem: problem && couponMessage(code, problem) }
}

/**
 * Check a coupon and count one use, returning the discount it gives. The coupon
 * stays locked until the order's transaction ends, so its usage limits hold
 * against concurrent orders; a refusal rolls the whole order back.
 */
export async function redeemCoupon(code: string, context: CouponContext): Promise<number> {
  const coupon = await lockCouponByCode(code)
  const { discount, problem } = await assess(coupon, context, true)
  if (problem) throw new CommerceError(couponMessage(code, problem), 'VALIDATION', 422)

  // A coupon that gave nothing, like free shipping on a digital order, isn't used up.
  if (discount > 0) await incrementCouponUsage(coupon!.id)
  return discount
}

/** Give back the use a cancelled order took. */
export async function releaseCoupon(code: string): Promise<void> {
  const coupon = await findCouponByCode(code)
  if (coupon) await decrementCouponUsage(coupon.id)
}
