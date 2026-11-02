import { cn } from '@prood/ui/lib/utils';

export type CodeLine = { text: string; tone?: 'comment' | 'command' | 'output' };

/** Three quiet dots, the marketing site's code window chrome. */
export function CodeWindowDots() {
  return (
    <span className="flex shrink-0 gap-1.5" aria-hidden>
      <span className="size-2.5 rounded-full bg-muted-foreground/40" />
      <span className="size-2.5 rounded-full bg-muted-foreground/40" />
      <span className="size-2.5 rounded-full bg-muted-foreground/40" />
    </span>
  );
}

/**
 * Static terminal-style sample, from the marketing site's CodeWindow. MDX code
 * blocks get the same frame through components/code-block.tsx.
 * Lines must be unique.
 */
export function CodeWindow({
  title,
  lines,
  className,
}: {
  title: string;
  lines: CodeLine[];
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-card-foreground',
        className,
      )}
    >
      <figcaption className="flex items-center gap-2 border-b border-border px-4 py-3">
        <CodeWindowDots />
        <span className="ml-2 font-mono text-xs text-muted-foreground">{title}</span>
      </figcaption>
      <pre className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-6">
        <code>
          {lines.map((line) => (
            <span
              key={`${line.tone ?? 'blank'}:${line.text}`}
              className={cn(
                'block min-h-6 whitespace-pre',
                line.tone === 'comment' && 'text-muted-foreground',
                line.tone === 'command' && 'text-foreground',
                line.tone === 'output' && 'text-brand',
              )}
            >
              {line.text}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
