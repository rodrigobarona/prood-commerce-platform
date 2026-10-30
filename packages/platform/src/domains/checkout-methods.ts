// ---------------------------------------------------------------------------
// Checkout methods — the shipping and payment options a store offers
// ---------------------------------------------------------------------------

import type { PaymentMethod, ShippingMethod } from '@prood/types'
import { priceRequired } from './helpers.js'

const STANDARD_SHIPPING = {
  en: 'Standard Shipping',
  pt: 'Envio padrão',
  es: 'Envío estándar',
}

const EXPRESS_SHIPPING = {
  en: 'Express Shipping',
  pt: 'Envio expresso',
  es: 'Envío express',
}

const CARD_PAYMENT = {
  en: 'Credit / Debit Card',
  pt: 'Cartão de crédito / débito',
  es: 'Tarjeta de crédito / débito',
}

const COD_PAYMENT = {
  en: 'Cash on Delivery',
  pt: 'Pagamento na entrega',
  es: 'Pago contra reembolso',
}

export function listShippingMethods(currency: string): ShippingMethod[] {
  return [
    {
      id: 'standard',
      name: STANDARD_SHIPPING,
      provider: 'custom',
      fulfillmentType: 'shipping',
      price: priceRequired(15, currency),
      estimatedDays: { min: 5, max: 7 },
      cashOnDelivery: false,
    },
    {
      id: 'express',
      name: EXPRESS_SHIPPING,
      provider: 'custom',
      fulfillmentType: 'shipping',
      price: priceRequired(35, currency),
      estimatedDays: { min: 1, max: 2 },
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
    {
      id: 'cod',
      type: 'cash_on_delivery',
      name: COD_PAYMENT,
      provider: 'platform',
      installments: null,
      icon: null,
    },
  ]
}
