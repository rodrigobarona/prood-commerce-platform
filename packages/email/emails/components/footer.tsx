import { Column, Link, Row, Section, Text } from 'react-email'

export interface EmailFooterProps {
  companyName: string
  tagline?: string
  address?: string
  unsubscribeUrl?: string
}

export function EmailFooter({
  companyName,
  tagline = 'Commerce infrastructure for modern brands.',
  address = 'Prood Commerce Platform',
  unsubscribeUrl,
}: EmailFooterProps) {
  return (
    <Section className="bg-bg">
      <Row>
        <Column className="px-6 py-10 text-center">
          <Text className="font-13 text-fg-3 mx-auto mt-0 mb-8 max-w-[280px] text-center font-sans">
            {tagline}
          </Text>

          <Text className="font-11 text-fg-3 mt-4 mb-5 text-center font-sans">{address}</Text>

          {unsubscribeUrl ? (
            <Text className="font-11 text-fg-3 m-0 text-center font-sans">
              <Link href={unsubscribeUrl} className="text-fg-3">
                Unsubscribe
              </Link>{' '}
              from {companyName} marketing emails.
            </Text>
          ) : null}
        </Column>
      </Row>
    </Section>
  )
}
