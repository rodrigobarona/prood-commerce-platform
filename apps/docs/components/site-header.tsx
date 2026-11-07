'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import {
  FullSearchTrigger,
  SearchTrigger,
} from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { ListIcon } from '@phosphor-icons/react';
import { Button } from '@prood/ui/components/button';
import { Logo } from '@prood/ui/components/logo';
import { cn } from '@prood/ui/lib/utils';
import { mainNav, site } from '@/lib/site';

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

/** The marketing site's header, with search where its sign-in link sits. */
export function SiteHeader({
  overlay = false,
  menu,
  className,
}: {
  /** Starts transparent over a hero. */
  overlay?: boolean;
  /** Opens the docs navigation on small screens. */
  menu?: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  // Turns solid once you scroll off a full-bleed hero.
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 48,
    () => false,
  );
  const transparent = overlay && !scrolled;

  return (
    <header
      data-overlay={transparent || undefined}
      className={cn('sticky top-0 z-30', transparent && 'surface-ink surface-photo bg-transparent!', className)}
    >
      {/* Wider than the layout column it sits in, so the bar is always full-bleed. */}
      <div
        aria-hidden
        className={cn(
          '-inset-x-[100vw] absolute inset-y-0 border-b transition-[background-color,border-color] duration-200 ease-standard',
          transparent
            ? 'border-transparent'
            : 'border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75',
        )}
      />
      <div className="relative mx-auto flex h-16 max-w-[84rem] items-center gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="/docs" aria-label="Prood docs home" className="flex items-center gap-3.5 rounded-md">
          <Logo title={null} className="h-7" />
          <span className="text-sm font-medium text-muted-foreground">Docs</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-brand aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <FullSearchTrigger className="hidden w-52 bg-transparent xl:inline-flex" />
          <SearchTrigger size="icon" className="xl:hidden" />
          <ThemeSwitch className="hidden md:inline-flex" />
          <Button size="lg" className="ml-1 hidden rounded-full sm:inline-flex" asChild>
            <a href={site.registerUrl}>Start free</a>
          </Button>
          {menu}
        </div>
      </div>
    </header>
  );
}

/** The site header in the docs grid, with the sidebar drawer behind its menu button. */
export function DocsHeader() {
  const { slots } = useNotebookLayout();
  const Trigger = slots.sidebar?.trigger;

  return (
    <SiteHeader
      className="[grid-area:header] layout:[--fd-header-height:--spacing(16)]"
      menu={
        Trigger ? (
          <Trigger aria-label="Open navigation" className="inline-flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden">
            <ListIcon className="size-5" aria-hidden />
          </Trigger>
        ) : null
      }
    />
  );
}
