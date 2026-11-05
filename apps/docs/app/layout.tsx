import type { Metadata, Viewport } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from 'next/font/google';
import './global.css';
import { docsOrigin } from '@/lib/shared';

const fontSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-family-sans' });
const fontHeading = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-family-heading',
});
const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-family-mono' });


export const metadata: Metadata = {
  metadataBase: new URL(docsOrigin),
  title: {
    default: 'Prood docs',
    template: '%s · Prood docs',
  },
  description:
    'Guides and reference for Prood: the dashboard, the REST API, the MCP server and Agent Auth.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfaf6' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1016' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-svh flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
