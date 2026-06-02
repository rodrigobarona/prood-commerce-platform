import { Button, Heading, Hr, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface OrderConfirmationEmailProps {
  companyName: string
  customerName: string
  orderNumber: string
  orderTotal: string
  orderUrl: string
}

export function OrderConfirmationEmail({
  companyName,
  customerName,
  orderNumber,
  orderTotal,
  orderUrl,
}: OrderConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Order #${orderNumber} confirmed`} companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            Order confirmed
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-4 max-w-[380px] text-center font-sans">
          Hi {customerName},
        </Text>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          Thanks for your order. We&apos;ve received it and will notify you when it ships.
        </Text>

        <Section className="bg-bg mx-auto mb-8 max-w-[380px] rounded-lg px-6 py-5 text-left">
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Order number</Text>
          <Text className="font-16 text-fg m-0 mb-4 font-sans">{orderNumber}</Text>
          <Hr className="border-stroke my-4" />
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Total</Text>
          <Text className="font-16 text-fg m-0 font-sans">{orderTotal}</Text>
        </Section>

        <Section className="mb-6 text-center">
          <Button
            href={orderUrl}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            View order
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  )
}

OrderConfirmationEmail.PreviewProps = {
  companyName: 'Prood Store',
  customerName: 'Alex',
  orderNumber: 'ORD-10042',
  orderTotal: 'EUR 49.90',
  orderUrl: 'https://example.com/orders/ORD-10042',
} satisfies OrderConfirmationEmailProps

export default OrderConfirmationEmail
