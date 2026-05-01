import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }

  const [videoCount, categoryCount, orderAgg, publishedVideos] = await Promise.all([
    prisma.video.count(),
    prisma.category.count(),
    prisma.order.aggregate({
      where: { status: 'completed' },
      _sum: { amountTotalCents: true },
      _count: true,
    }),
    prisma.video.count({ where: { published: true } }),
  ]);

  return NextResponse.json({
    videos: videoCount,
    publishedVideos,
    categories: categoryCount,
    orders: orderAgg._count,
    revenueCents: orderAgg._sum.amountTotalCents ?? 0,
  });
}
