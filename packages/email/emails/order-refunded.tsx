import { Button, Heading, Hr, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface OrderRefundedEmailProps {
  companyName: string
  customerName: string
  orderNumber: string
  refundAmount: string
  orderUrl: string
}

export function OrderRefundedEmail({
  companyName,
  customerName,
  orderNumber,
  refundAmount,
  orderUrl,
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
          We&apos;ve processed a refund for your order #{orderNumber}. The funds will be returned
          to your original payment method.
        </Text>

        <Section className="bg-bg mx-auto mb-8 max-w-[380px] rounded-lg px-6 py-5 text-left">
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Order number</Text>
          <Text className="font-16 text-fg m-0 mb-4 font-sans">{orderNumber}</Text>
          <Hr className="border-stroke my-4" />
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Refund amount</Text>
          <Text className="font-16 text-fg m-0 font-sans">{refundAmount}</Text>
        </Section>

        <Section className="mb-6 text-center">
          <Button
            href={orderUrl}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            View order details
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
