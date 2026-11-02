// ---------------------------------------------------------------------------
// Checkout methods — the shipping and payment options a store offers
// ---------------------------------------------------------------------------

import { FIXED_SHIPPING_RATES } from '@prood/types'
import type { PaymentMethod, ShippingMethod } from '@prood/types'
import { priceRequired } from './helpers.js'

const STANDARD_SHIPPING = {
  en: 'Standard shipping',
  pt: 'Envio padrão',
  es: 'Envío estándar',
}

const EXPRESS_SHIPPING = {
  en: 'Express shipping',
  pt: 'Envio expresso',
  es: 'Envío express',
}

const CARD_PAYMENT = {
  en: 'Credit / Debit Card',
  pt: 'Cartão de crédito / débito',
  es: 'Tarjeta de crédito / débito',
}

export function listShippingMethods(currency: string): ShippingMethod[] {
  return [
    {
      id: 'standard',
      name: STANDARD_SHIPPING,
      provider: 'custom',
      fulfillmentType: 'shipping',
      price: priceRequired(FIXED_SHIPPING_RATES.standard.amount, currency),
      estimatedDays: { ...FIXED_SHIPPING_RATES.standard.days },
      cashOnDelivery: false,
    },
    {
      id: 'express',
      name: EXPRESS_SHIPPING,
      provider: 'custom',
      fulfillmentType: 'shipping',
      price: priceRequired(FIXED_SHIPPING_RATES.express.amount, currency),
      estimatedDays: { ...FIXED_SHIPPING_RATES.express.days },
      cashOnDelivery: false,
    },
  ]
}

export function listPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: 'card',
      type: 'card',
      name: CARD_PAYMENT,
      provider: 'platform',
      installments: null,
      icon: null,
    },
  ]
}
