import { Button, Heading, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface ActivationEmailProps {
  companyName: string
  url: string
}

export function ActivationEmail({ companyName, url }: ActivationEmailProps) {
  return (
    <EmailLayout preview="Confirm your email address" companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            We&apos;re almost there!
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          Thank you for signing up for {companyName}.
          <br />
          To verify your account, we just need to confirm your email address.
        </Text>

        <Section className="mb-6 text-center">
          <Button
            href={url}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            Confirm email
          </Button>
        </Section>

        <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
          If you didn&apos;t request this,
          <br />
          please ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

ActivationEmail.PreviewProps = {
  companyName: 'Prood',
  url: 'https://example.com/activate',
} satisfies ActivationEmailProps

export default ActivationEmail
