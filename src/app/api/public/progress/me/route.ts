import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const rows = await prisma.userVideoProgress.findMany({
    where: { userId: gate.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      video: {
        select: {
          title: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    progress: rows.map((row) => ({
      videoTitle: row.video.title,
      currentTime: row.currentTime,
      duration: row.duration,
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}
