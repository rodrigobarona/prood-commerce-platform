import { Button, Heading, Section, Text } from 'react-email'

import { EmailLayout } from './components/layout.js'

export interface TeamInviteEmailProps {
  companyName: string
  inviterName: string
  inviteUrl: string
  role?: string
}

export function TeamInviteEmail({
  companyName,
  inviterName,
  inviteUrl,
  role = 'member',
}: TeamInviteEmailProps) {
  return (
    <EmailLayout preview={`Join ${companyName} on Prood`} companyName={companyName}>
      <Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center">
        <Section className="mb-3">
          <Heading as="h1" className="font-28 text-fg m-0 font-sans">
            You&apos;re invited
          </Heading>
        </Section>

        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[380px] text-center font-sans">
          {inviterName} invited you to join {companyName} as a {role}. Accept the invitation to
          start collaborating.
        </Text>

        <Section className="mb-6 text-center">
          <Button
            href={inviteUrl}
            className="bg-brand font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
          >
            Accept invitation
          </Button>
        </Section>

        <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
          If you weren&apos;t expecting this invitation, you can ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  )
}

TeamInviteEmail.PreviewProps = {
  companyName: 'Prood',
  inviterName: 'Alex',
  inviteUrl: 'https://dashboard.prood.com/invite/abc123',
  role: 'admin',
} satisfies TeamInviteEmailProps

export default TeamInviteEmail
