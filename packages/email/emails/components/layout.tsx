import type { ReactNode } from 'react'
import { Body, Container, Head, Html, Preview, Section, Tailwind, Text } from 'react-email'

import { proodTailwindConfig } from '../theme.js'
import { ProodFonts } from '../theme-fonts.js'
import { EmailFooter, type EmailFooterProps } from './footer.js'

export interface EmailLayoutProps {
  preview: string
  companyName: string
  children: ReactNode
  footer?: EmailFooterProps
}

const PLATFORM = 'Prood'

/** Shoppers hear from the store, so its name heads the email and Prood only signs off. */
export function EmailLayout({ preview, companyName, children, footer }: EmailLayoutProps) {
  const sender = companyName.trim() || PLATFORM

  return (
    <Tailwind config={proodTailwindConfig}>
      <Html lang="en">
        <Head>
          <ProodFonts />
        </Head>

        <Body className="bg-bg-2 m-0 text-center font-sans">
          <Preview>{preview}</Preview>
          <Container className="mobile:mt-0 mx-auto mt-8 w-full max-w-[640px]">
            <Section>
              <Section className="bg-bg mobile:px-2 px-6 py-4">
                <Section className="mb-3 px-6">
                  <Text className="font-16 text-fg m-0 py-[7px] text-left font-sans font-semibold">
                    {sender}
                  </Text>
                </Section>

                {children}

                <EmailFooter companyName={sender} {...footer} />

                {sender === PLATFORM ? null : (
                  <Text className="font-11 text-fg-3 mt-4 mb-0 text-center font-sans">
                    Powered by {PLATFORM}
                  </Text>
                )}
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
