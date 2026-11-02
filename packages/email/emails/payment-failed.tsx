import { Button, Heading, Hr, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface PaymentFailedEmailProps {
  companyName: string
  customerName: string
  orderNumber: string
  orderTotal: string
  storeUrl: string
}

export function PaymentFailedEmail({
  companyName,
  customerName,
  orderNumber,
  orderTotal,
  storeUrl,
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview={`Payment failed for order #${orderNumber}`} companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            Payment failed
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-4 max-w-[380px] text-center font-sans">
          Hi {customerName},
        </Text>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          Your payment didn&apos;t go through, so you haven&apos;t been charged.
        </Text>

        <Section className="bg-bg mx-auto mb-8 max-w-[380px] rounded-lg px-6 py-5 text-left">
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Order number</Text>
          <Text className="font-16 text-fg m-0 mb-4 font-sans">{orderNumber}</Text>
          <Hr className="border-stroke my-4" />
          <Text className="font-13 text-fg-3 m-0 mb-2 font-sans">Order total</Text>
          <Text className="font-16 text-fg m-0 font-sans">{orderTotal}</Text>
        </Section>

        <Section className="mb-6 text-center">
          <Button
            href={storeUrl}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            Back to the store
          </Button>
        </Section>

        <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
          If this keeps happening, contact {companyName}.
        </Text>
      </Section>
    </EmailLayout>
  )
}

PaymentFailedEmail.PreviewProps = {
  companyName: 'Prood Store',
  customerName: 'Alex',
  orderNumber: 'ORD-10042',
  orderTotal: 'EUR 49.90',
  storeUrl: 'https://example.com/products',
} satisfies PaymentFailedEmailProps

export default PaymentFailedEmail
