import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireAppUser } from '@/lib/app-auth';

export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;
  const now = new Date();

  const purchases = await prisma.purchase.findMany({
    where: {
      userId: gate.user.id,
      status: 'completed',
      OR: [
        { kind: 'category' },
        { kind: 'video', accessExpiresAt: null },
        { kind: 'video', accessExpiresAt: { gt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  const videoIds = purchases.filter((p) => p.kind === 'video').map((p) => p.targetId);
  const categoryIds = purchases.filter((p) => p.kind === 'category').map((p) => p.targetId);

  const [videos, categories] = await Promise.all([
    videoIds.length
      ? prisma.video.findMany({ where: { id: { in: videoIds } }, select: { title: true } })
      : Promise.resolve([]),
    categoryIds.length
      ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { name: true } })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ok: true,
    purchasedVideos: videos.map((v) => {
      const p = purchases.find((p) => p.kind === 'video' && p.targetId === v.id);
      return { title: v.title, expiresAt: p?.accessExpiresAt };
    }),
    purchasedCategories: categories.map((c) => {
      const p = purchases.find((p) => p.kind === 'category' && p.targetId === c.id);
      return { name: c.name, expiresAt: p?.accessExpiresAt };
    }),
  });
}

