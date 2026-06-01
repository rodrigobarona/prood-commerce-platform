import { MermaidViewer } from '@/components/mermaid-viewer';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { renderMermaidSVG } from 'beautiful-mermaid';

type MermaidProps = {
  chart: string;
};

export async function Mermaid({ chart }: MermaidProps) {
  let svg: string
  try {
    svg = renderMermaidSVG(chart.trim(), {
      bg: 'var(--color-fd-background, var(--background, #ffffff))',
      fg: 'var(--color-fd-foreground, var(--foreground, #27272a))',
      accent: 'var(--color-fd-primary, var(--primary, #6366f1))',
      muted: 'var(--color-fd-muted-foreground, var(--muted-foreground, #71717a))',
      transparent: true,
      padding: 32,
      nodeSpacing: 28,
      layerSpacing: 48,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return (
      <div className="my-6 space-y-4">
        <div className="rounded-xl border border-fd-border bg-fd-muted/30 p-4">
          <p className="mb-2 text-sm font-medium text-fd-destructive">
            Failed to render diagram
          </p>
          <pre className="overflow-x-auto text-xs text-fd-muted-foreground">
            {message}
          </pre>
        </div>
        <CodeBlock title="Mermaid">
          <Pre>{chart}</Pre>
        </CodeBlock>
      </div>
    );
  }

  return <MermaidViewer svg={svg} />;
}
