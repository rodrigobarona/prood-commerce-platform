import { Button, Heading, Hr, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface OrderShippedEmailProps {
  companyName: string
  customerName: string
  orderNumber: string
  trackingNumber?: string
  trackingUrl?: string
  orderUrl: string
}

export function OrderShippedEmail({
  companyName,
  customerName,
  orderNumber,
  trackingNumber,
  trackingUrl,
  orderUrl,
}: OrderShippedEmailProps) {
  return (
    <EmailLayout preview={`Order #${orderNumber} has shipped`} companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            Your order has shipped
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-4 max-w-[380px] text-center font-sans">
          Hi {customerName},
        </Text>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          Great news! Your order #{orderNumber} is on its way.
        </Text>

        {trackingNumber ? (
          <Section className="bg-bg mx-auto mb-8 max-w-[380px] rounded-lg px-6 py-5 text-left">
            <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Tracking number</Text>
            <Text className="font-16 text-fg m-0 font-sans">{trackingNumber}</Text>
          </Section>
        ) : null}

        <Section className="mb-6 text-center">
          <Button
            href={trackingUrl ?? orderUrl}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            {trackingUrl ? 'Track your order' : 'View order'}
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  )
}

OrderShippedEmail.PreviewProps = {
  companyName: 'Prood Store',
  customerName: 'Alex',
  orderNumber: 'ORD-10042',
  trackingNumber: 'CTT-PT-123456789',
  trackingUrl: 'https://track.example.com/CTT-PT-123456789',
  orderUrl: 'https://example.com/orders/ORD-10042',
} satisfies OrderShippedEmailProps

export default OrderShippedEmail
