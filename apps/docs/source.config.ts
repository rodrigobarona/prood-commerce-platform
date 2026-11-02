import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins/rehype-code';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { codeThemes } from './lib/code-theme';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid],
    rehypeCodeOptions: {
      themes: codeThemes,
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        // Names the code window in components/code-block.tsx.
        {
          name: 'prood:language',
          pre(node) {
            node.properties['data-language'] = this.options.lang;
          },
        },
      ],
    },
  },
});
