import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { phosphorIconsPlugin } from '@/lib/phosphor-icons';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { docsImageRoute, docsOrigin, docsRoute } from './shared';
import { openapi } from './openapi';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(
  {
    docs: docs.toFumadocsSource(),
    openapi: await openapi.staticSource({
      baseDir: 'api',
      groupBy: 'tag',
    }),
  },
  {
    baseUrl: docsRoute,
    plugins: [phosphorIconsPlugin(), openapiPlugin()],
  },
);

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

/**
 * `segments` are the content route's own params. `url` is what readers and agents
 * request: the page's address plus `.md`, which proxy.ts rewrites to that route, so
 * it stays under /docs and reaches this app through the gateway's /docs rewrite.
 */
export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  return {
    segments: [...page.slugs, 'content.md'],
    url: `${page.url}.md`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  if (page.type === 'openapi') {
    return JSON.stringify(page.data.getSchema().bundled, null, 2);
  }

  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${docsOrigin}${page.url})

${processed}`;
}
