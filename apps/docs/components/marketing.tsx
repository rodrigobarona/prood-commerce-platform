import type { ReactNode } from 'react';
import { cn } from '@prood/ui/lib/utils';

/** Layout helpers from the marketing site, so both open on the same grid. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-[84rem] px-5 sm:px-8 lg:px-12', className)}>
      {children}
    </div>
  );
}

export function Section({
  labelledBy,
  surface = 'page',
  children,
}: {
  /** id of the section heading, for the landmark's accessible name */
  labelledBy: string;
  surface?: 'page' | 'ink';
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn('py-20 md:py-32', surface === 'ink' && 'surface-ink')}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-eyebrow text-brand">{eyebrow}</p>
      <h2 id={id} className="mt-4 text-display-md">
        {title}
      </h2>
      {description ? <p className="mt-6 text-lead text-muted-foreground">{description}</p> : null}
    </div>
  );
}
