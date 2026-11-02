import { Button, Heading, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface WelcomeEmailProps {
  companyName: string
  name: string
  dashboardUrl: string
  /** The store's contact email, when it has one. Without it, the line stays out */
  contactEmail?: string | null
}

export function WelcomeEmail({ companyName, name, dashboardUrl, contactEmail }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${companyName}`} companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            Welcome to {companyName}
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-4 max-w-[380px] text-center font-sans">
          Hi {name},
        </Text>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          Thanks for signing up. Your account is ready.
        </Text>

        <Section className="mb-6 text-center">
          <Button
            href={dashboardUrl}
            className="bg-brand font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            Your account
          </Button>
        </Section>

        {contactEmail ? (
          <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
            Questions? Write to {contactEmail}.
          </Text>
        ) : null}
      </Section>
    </EmailLayout>
  )
}

WelcomeEmail.PreviewProps = {
  companyName: 'Prood',
  name: 'Alex',
  dashboardUrl: 'https://example.com/account',
  contactEmail: 'hello@example.com',
} satisfies WelcomeEmailProps

export default WelcomeEmail
