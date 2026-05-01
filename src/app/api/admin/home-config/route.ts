import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  recommendedVideoTitles: z.array(z.string().min(1)).optional(),
  featuredCategories: z.array(z.string().min(1)).optional(),
  showContinueWatching: z.boolean().optional(),
  isReviewMode: z.boolean().optional(),
  buyButtonText: z.string().min(1).optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const [cfg, videos, categories] = await Promise.all([
    prisma.appHomeConfig.findUnique({ where: { key: 'default' } }),
    prisma.video.findMany({
      select: { id: true, title: true, published: true },
      orderBy: { title: 'asc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  let recommendedVideoTitles: string[] = [];
  let featuredCategories: string[] = [];
  try {
    recommendedVideoTitles = JSON.parse(cfg?.recommendedVideoTitlesJson ?? '[]') as string[];
  } catch {}
  try {
    featuredCategories = JSON.parse(cfg?.featuredCategoryNamesJson ?? '[]') as string[];
  } catch {}

  return NextResponse.json({
    config: {
      recommendedVideoTitles,
      featuredCategories,
      showContinueWatching: cfg?.showContinueWatching ?? true,
      isReviewMode: cfg?.isReviewMode ?? false,
      buyButtonText: cfg?.buyButtonText ?? 'Buy Now',
    },
    options: {
      videos: videos.filter((v) => v.published),
      categories,
    },
  });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const updated = await prisma.appHomeConfig.upsert({
    where: { key: 'default' },
    update: {
      ...(body.recommendedVideoTitles
        ? { recommendedVideoTitlesJson: JSON.stringify(Array.from(new Set(body.recommendedVideoTitles))) }
        : {}),
      ...(body.featuredCategories
        ? { featuredCategoryNamesJson: JSON.stringify(Array.from(new Set(body.featuredCategories))) }
        : {}),
      ...(typeof body.showContinueWatching === 'boolean'
        ? { showContinueWatching: body.showContinueWatching }
        : {}),
      ...(typeof body.isReviewMode === 'boolean'
        ? { isReviewMode: body.isReviewMode }
        : {}),
      ...(body.buyButtonText
        ? { buyButtonText: body.buyButtonText }
        : {}),
    },
    create: {
      key: 'default',
      recommendedVideoTitlesJson: JSON.stringify(Array.from(new Set(body.recommendedVideoTitles ?? []))),
      featuredCategoryNamesJson: JSON.stringify(Array.from(new Set(body.featuredCategories ?? []))),
      showContinueWatching: body.showContinueWatching ?? true,
      isReviewMode: body.isReviewMode ?? false,
      buyButtonText: body.buyButtonText ?? 'Buy Now',
    },
  });

  return NextResponse.json({
    ok: true,
    config: {
      recommendedVideoTitles: JSON.parse(updated.recommendedVideoTitlesJson) as string[],
      featuredCategories: JSON.parse(updated.featuredCategoryNamesJson) as string[],
      showContinueWatching: updated.showContinueWatching,
      isReviewMode: updated.isReviewMode,
      buyButtonText: updated.buyButtonText,
    },
  });
}
