import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

/** Sections a merchant reads. Everything else is for developers and contributors. */
const merchantPages =
  /^\/docs(\/(getting-started|guides(?!\/(deployment|machine-access))|billing|apps\/dashboard)(\/|$|#)|$|#)/;

function tier(document: unknown): number {
  const url = (document as { url?: string }).url ?? '';
  return merchantPages.test(url) ? 0 : 1;
}

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
  search: {
    // Merchant pages come first; within a group, the best match does.
    sortBy: ([, scoreA, a], [, scoreB, b]) => tier(a) - tier(b) || scoreB - scoreA,
  },
});
