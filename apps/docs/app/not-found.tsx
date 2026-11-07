import Link from 'next/link';
import { Button } from '@prood/ui/components/button';
import { Container } from '@/components/marketing';
import { SiteHeader } from '@/components/site-header';

export default function NotFound() {
  return (
    <>
      <SiteHeader className="overflow-x-clip" />
      <main id="content" className="flex flex-1 items-center">
        <Container className="py-20">
          <p className="text-eyebrow text-brand">404</p>
          <h1 className="mt-4 text-display-md">We couldn&apos;t find that page.</h1>
          <p className="mt-6 max-w-xl text-lead text-muted-foreground">
            It may have moved. Search the docs, or start again from the home page.
          </p>
          <Button size="lg" className="mt-9" asChild>
            <Link href="/docs">Go to the docs home</Link>
          </Button>
        </Container>
      </main>
    </>
  );
}
