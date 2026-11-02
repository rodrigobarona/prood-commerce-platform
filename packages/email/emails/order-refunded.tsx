import { Button, Heading, Hr, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface OrderRefundedEmailProps {
  companyName: string
  customerName: string
  orderNumber: string
  refundAmount: string
  /** Partial refunds can report the running total instead of this refund */
  refundAmountLabel?: string
  orderUrl: string
  /** For a guest, who has no account page to open */
  orderLabel?: string
  /** Only when a provider sent it back. A recorded refund, or Multibanco, may need more from the shopper */
  returnedToPaymentMethod?: boolean
}

export function OrderRefundedEmail({
  companyName,
  customerName,
  orderNumber,
  refundAmount,
  refundAmountLabel = 'Refund amount',
  orderUrl,
  orderLabel = 'View order details',
  returnedToPaymentMethod = false,
}: OrderRefundedEmailProps) {
  return (
    <EmailLayout preview={`Refund for order #${orderNumber}`} companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            Refund processed
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-4 max-w-[380px] text-center font-sans">
          Hi {customerName},
        </Text>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          We&apos;ve processed a refund for your order #{orderNumber}.{' '}
          {returnedToPaymentMethod
            ? 'The funds will be returned to your original payment method.'
            : `${companyName} will tell you if it needs anything from you to send it back.`}
        </Text>

        <Section className="bg-bg mx-auto mb-8 max-w-[380px] rounded-lg px-6 py-5 text-left">
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Order number</Text>
          <Text className="font-16 text-fg m-0 mb-4 font-sans">{orderNumber}</Text>
          <Hr className="border-stroke my-4" />
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">{refundAmountLabel}</Text>
          <Text className="font-16 text-fg m-0 font-sans">{refundAmount}</Text>
        </Section>

        <Section className="mb-6 text-center">
          <Button
            href={orderUrl}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            {orderLabel}
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  )
}

OrderRefundedEmail.PreviewProps = {
  companyName: 'Prood Store',
  customerName: 'Alex',
  orderNumber: 'ORD-10042',
  refundAmount: 'EUR 49.90',
  orderUrl: 'https://example.com/orders/ORD-10042',
} satisfies OrderRefundedEmailProps

export default OrderRefundedEmail
