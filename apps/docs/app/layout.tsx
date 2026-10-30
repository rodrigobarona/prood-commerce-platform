import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from 'next/font/google';
import './global.css';

const fontSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-family-sans' });
const fontHeading = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-family-heading',
});
const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-family-mono' });

const docsOrigin =
  process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/$/, '') ?? 'http://localhost:3003';

export const metadata: Metadata = {
  metadataBase: new URL(docsOrigin),
  title: {
    default: 'Prood docs',
    template: '%s · Prood docs',
  },
  description:
    'Guides and reference for Prood: the dashboard, the REST API, the MCP server and Agent Auth.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
