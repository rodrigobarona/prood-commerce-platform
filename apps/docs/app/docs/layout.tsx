import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { DocsHeader } from '@/components/site-header';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{ mode: 'top' }}
      sidebar={{ collapsible: false }}
      slots={{ header: DocsHeader }}
    >
      {children}
    </DocsLayout>
  );
}
