import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  // Every API page resolves to the same bundled spec, so include it once.
  const pages = source.getPages();
  const spec = pages.find((page) => page.type === 'openapi');
  const scanned = await Promise.all(
    [...pages.filter((page) => page.type !== 'openapi'), ...(spec ? [spec] : [])].map(getLLMText),
  );

  return new Response(scanned.join('\n\n'));
}
