// ---------------------------------------------------------------------------
// Promotions domain — discounts and coupons
// ---------------------------------------------------------------------------

import type { Promotion, Coupon } from '@prood/types'
import {
  findActivePromotions,
  findCouponByCode,
  findPromotionById,
} from '../database/index.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { couponStateProblem, mapPromotion } from './coupons.js'

export function createPromotionsDomain() {
  return {
    async getActivePromotions(): Promise<Promotion[]> {
      const [rows, currency] = await Promise.all([findActivePromotions(), getStoreCurrency()])
      return rows.map(row => mapPromotion(row, currency))
    },

    async validateCoupon(code: string): Promise<Coupon | null> {
      const couponRow = await findCouponByCode(code)
      if (!couponRow) return null

      const promoRow = await findPromotionById(couponRow.promotionId)
      if (!promoRow) return null

      const currency = await getStoreCurrency()
      const promotion = mapPromotion(promoRow, currency)
      const problem = couponStateProblem(couponRow, promotion, currency)

      return {
        id: couponRow.id,
        code: couponRow.code,
        promotion,
        isValid: problem === null,
        invalidReason: problem === 'disabled' ? couponRow.invalidReason ?? problem : problem,
        timesUsed: couponRow.timesUsed,
      }
    },
  }
}
