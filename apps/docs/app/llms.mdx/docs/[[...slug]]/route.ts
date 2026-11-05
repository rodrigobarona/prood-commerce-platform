import { getLLMText, getPageMarkdownUrl, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { docsOrigin } from '@/lib/shared';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      // The HTML page is the one to index; this is its copy for agents.
      'X-Robots-Tag': 'noindex',
      Link: `<${docsOrigin}${page.url}>; rel="canonical"`,
      Vary: 'Accept',
    },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
