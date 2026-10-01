import { buildManifest } from '@/lib/manifest';
import { isCardToken } from '@/lib/token';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isCardToken(token)) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(buildManifest(`/c/${token}`)), {
    headers: {
      'content-type': 'application/manifest+json',
      'cache-control': 'public, max-age=3600',
    },
  });
}
