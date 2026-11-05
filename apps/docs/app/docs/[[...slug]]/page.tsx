import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import { APIPage } from '@/components/api-page';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { TOC, TOCProvider } from 'fumadocs-ui/layouts/notebook/page/slots/toc';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { DocsTOCPopover } from '@/components/toc-popover';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb';
import { JsonLd } from '@prood/ui/components/json-ld';
import { breadcrumbJsonLd, SCHEMA_CONTEXT } from '@prood/ui/lib/json-ld';
import { docsOrigin, gitConfig } from '@/lib/shared';

/** Page titles and breadcrumbs sit on the marketing site's type scale. */
const titleClass = 'font-medium text-[2.25rem] leading-tight tracking-[-0.012em] md:text-[2.75rem]';
const breadcrumb = { className: 'docs-breadcrumb' };
/** A landmark, so the page's outline isn't loose outside one. */
const tocLandmark = { container: { role: 'navigation', 'aria-label': 'On this page' } };
const tocSlots = { provider: TOCProvider, main: TOC, popover: DocsTOCPopover };

/**
 * The breadcrumb is the page's eyebrow, and it only shows parent folders. A
 * top-level page or folder index has none, so it takes the sidebar section it
 * sits under.
 */
function topLevelEyebrow(url: string): string | undefined {
  let section = 'Prood docs';
  for (const node of source.getPageTree().children) {
    if (node.type === 'separator' && typeof node.name === 'string') section = node.name;
    if (node.type === 'page' && node.url === url) return section;
    if (node.type === 'folder' && node.index?.url === url) return section;
  }
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  if (page.type === 'openapi') {
    return (
      <DocsPage toc={page.data.toc} full breadcrumb={breadcrumb} tableOfContent={tocLandmark} slots={{ toc: tocSlots }}>
        <DocsTitle className={titleClass}>{page.data.title}</DocsTitle>
        <DocsBody>
          <APIPage {...page.data.getOpenAPIPageProps()} />
        </DocsBody>
      </DocsPage>
    );
  }

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const eyebrow = topLevelEyebrow(page.url);
  const trail = getBreadcrumbItems(page.url, source.getPageTree(), { includePage: true }).flatMap(
    (item): [string, string][] => (typeof item.name === 'string' && item.url ? [[item.name, item.url]] : []),
  );

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={breadcrumb}
      tableOfContent={tocLandmark}
      slots={{ toc: tocSlots }}
    >
      <JsonLd
        data={[
          {
            '@context': SCHEMA_CONTEXT,
            '@type': 'TechArticle',
            headline: page.data.title,
            ...(page.data.description ? { description: page.data.description } : {}),
            url: `${docsOrigin}${page.url}`,
            isPartOf: { '@type': 'WebSite', name: 'Prood docs', url: docsOrigin },
          },
          ...(trail.length > 1 ? [breadcrumbJsonLd(trail, docsOrigin)] : []),
        ]}
      />
      {eyebrow ? <p className="docs-breadcrumb text-fd-primary">{eyebrow}</p> : null}
      <DocsTitle className={titleClass}>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url, types: { 'text/markdown': `${page.url}.md` } },
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
