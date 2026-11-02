import { Column, Link, Row, Section, Text } from 'react-email'

export interface EmailFooterProps {
  companyName: string
  tagline?: string
  address?: string
  unsubscribeUrl?: string
}

/** Nothing by default: shoppers hear from the store, and an order email has nothing to add. */
export function EmailFooter({ companyName, tagline, address, unsubscribeUrl }: EmailFooterProps) {
  if (!tagline && !address && !unsubscribeUrl) return null

  return (
    <Section className="bg-bg">
      <Row>
        <Column className="px-6 py-10 text-center">
          {tagline ? (
            <Text className="font-13 text-fg-3 mx-auto mt-0 mb-8 max-w-[280px] text-center font-sans">
              {tagline}
            </Text>
          ) : null}

          {address ? (
            <Text className="font-11 text-fg-3 mt-4 mb-5 text-center font-sans">{address}</Text>
          ) : null}

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
