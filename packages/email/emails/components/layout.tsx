import type { ReactNode } from 'react'
import { Body, Column, Container, Head, Html, Preview, Row, Section, Tailwind, Text } from 'react-email'

import { proodTailwindConfig } from '../theme.js'
import { ProodFonts } from '../theme-fonts.js'
import { EmailFooter, type EmailFooterProps } from './footer.js'

export interface EmailLayoutProps {
  preview: string
  companyName: string
  children: ReactNode
  footer?: EmailFooterProps
}

export function EmailLayout({ preview, companyName, children, footer }: EmailLayoutProps) {
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
                  <Row>
                    <Column className="w-1/2 py-[7px] align-middle">
                      <Text className="font-16 text-fg m-0 text-left font-sans font-semibold">
                        Prood
                      </Text>
                    </Column>
                    <Column align="right" className="w-1/2 py-[7px] align-middle">
                      <Text className="font-13 m-0 text-right font-sans">
                        <span className="text-fg-3">{companyName}</span>
                      </Text>
                    </Column>
                  </Row>
                </Section>

                {children}

                <EmailFooter companyName={companyName} {...footer} />
              </Section>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}
