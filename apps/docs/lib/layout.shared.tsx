import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Logo } from '@prood/ui/components/logo';
import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-medium text-fd-muted-foreground">Docs</span>
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
