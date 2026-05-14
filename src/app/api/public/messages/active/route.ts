import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/messages/active
 * 
 * Returns the latest active in-app message that matches the 
 * user's platform and app version.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const platform = url.searchParams.get('platform') ?? 'all';
  const version = url.searchParams.get('version') ?? '0.0.0';

  try {
    const message = await prisma.inAppMessage.findFirst({
      where: {
        active: true,
        AND: [
          {
            OR: [
              { platform: 'all' },
              { platform },
            ],
          },
          {
            OR: [
              { targetVersion: null },
              { targetVersion: '*' },
              { targetVersion: version },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error('Failed to fetch active in-app message', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
