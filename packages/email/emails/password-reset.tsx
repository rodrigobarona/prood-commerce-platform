import { Button, Heading, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface PasswordResetEmailProps {
  companyName: string
  url: string
  expiresIn?: string
}

export function PasswordResetEmail({
  companyName,
  url,
  expiresIn = '1 hour',
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password" companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            Reset your password
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          We received a request to reset your password for {companyName}. Click the button below to
          choose a new password.
        </Text>

        <Section className="mb-6 text-center">
          <Button
            href={url}
            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            Reset password
          </Button>
        </Section>

        <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
          This link expires in {expiresIn}. If you didn&apos;t request a password reset, you can
          safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

PasswordResetEmail.PreviewProps = {
  companyName: 'Prood',
  url: 'https://example.com/reset-password?token=abc123',
  expiresIn: '1 hour',
} satisfies PasswordResetEmailProps

export default PasswordResetEmail
