import { NextResponse } from 'next/server';

import { buildPublicCatalogPayload } from '@/lib/public-catalog';

export const dynamic = 'force-dynamic';

/**
 * Public read-only catalog for mobile / web clients.
 * Cache briefly at the edge; clients should ETag or poll on cold start.
 */
export async function GET() {
  try {
    const payload = await buildPublicCatalogPayload();
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Catalog unavailable' }, { status: 500 });
  }
}
