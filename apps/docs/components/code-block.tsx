import { isValidElement, type ComponentProps, type ReactNode } from 'react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { CodeWindowDots } from '@/components/code-window';

const windowTitles: Record<string, string> = { bash: 'zsh', sh: 'zsh', shell: 'zsh', zsh: 'zsh' };

type CodeWindowPreProps = Omit<ComponentProps<'pre'>, 'ref'> & { 'data-language'?: string };

/** Shiki renders `<code>` with one `.line` span per line of source. */
function lineCount(code: ReactNode): number {
  if (!isValidElement<{ children?: ReactNode }>(code)) return 0;
  const lines = code.props.children;
  return Array.isArray(lines) ? lines.filter((line) => isValidElement(line)).length : 1;
}

/**
 * MDX code blocks: a sample in the marketing site's CodeWindow frame, and a
 * one-liner on its own, because a window around a single command is all chrome.
 * A block with an explicit title keeps its frame.
 */
export function CodeWindowPre({ title, children, ...props }: CodeWindowPreProps) {
  if (!title && lineCount(children) <= 1) {
    return (
      <CodeBlock {...props}>
        <Pre>{children}</Pre>
      </CodeBlock>
    );
  }

  const language = props['data-language'] ?? 'text';

  return (
    <CodeBlock {...props} title={title ?? windowTitles[language] ?? language} icon={<CodeWindowDots />}>
      <Pre>{children}</Pre>
    </CodeBlock>
  );
}
