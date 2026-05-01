import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const LANGUAGE_OPTIONS = ['Telugu', 'Tamil', 'Hindi', 'English'] as const;

function parseAmountFromLabel(label?: string): number | null {
  if (!label) return null;
  const match = label.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const rupees = Number(match[1]);
  if (!Number.isFinite(rupees) || rupees <= 0) return null;
  return Math.round(rupees * 100);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().optional().default(''),
  meta: z.string().optional().default(''),
  duration: z.string().min(1),
  level: z.string().min(1).optional().default('General'),
  language: z.enum(LANGUAGE_OPTIONS),
  lessons: z.number().int().nonnegative().optional().default(0),
  priceLabel: z.string().optional().default(''),
  individualPriceLabel: z.string().optional(),
  rating: z.number().min(0).max(5),
  description: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  dashUrl: z.string().url(),
  topics: z.array(z.string()).default([]),
  isFree: z.boolean().default(false),
  accessValidityDays: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  categoryName: z.string().min(1),
  addToCategoryPack: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const rows = await prisma.video.findMany({
    include: { category: true, packItems: true },
    orderBy: [{ createdAt: 'desc' }],
  });
  return NextResponse.json({ videos: rows });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  let category = await prisma.category.findFirst({
    where: { name: body.categoryName },
  });
  
  if (!category) {
    category = await prisma.category.findFirst({
      where: { name: 'General' },
    });
  }

  if (!category) {
    category = await prisma.category.create({
      data: { name: 'General', sortOrder: 999 }
    });
  }

  const maxSort = await prisma.video.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
  const derivedAmountCents = body.isFree
    ? 0
    : parseAmountFromLabel(body.individualPriceLabel ?? body.priceLabel) ?? 99_900;

  try {
    const video = await prisma.video.create({
      data: {
        title: body.title,
        subtitle: body.subtitle ?? '',
        meta: body.meta,
        duration: body.duration,
        level: body.level ?? 'General',
        language: body.language,
        lessons: body.lessons ?? 0,
        priceLabel: body.priceLabel ?? '',
        individualPriceLabel: body.individualPriceLabel,
        rating: body.rating,
        description: body.description,
        thumbnailUrl: body.thumbnailUrl,
        dashUrl: body.dashUrl,
        topicsJson: JSON.stringify(body.topics),
        isFree: body.isFree,
        accessValidityDays: body.isFree ? 0 : body.accessValidityDays,
        published: body.published,
        checkoutAmountCents: derivedAmountCents,
        sortOrder,
        categoryId: category.id,
      },
    });

    if (body.addToCategoryPack) {
      const maxPack = await prisma.categoryPackItem.aggregate({
        where: { categoryId: category.id },
        _max: { sortOrder: true },
      });
      await prisma.categoryPackItem.create({
        data: {
          categoryId: category.id,
          videoId: video.id,
          sortOrder: (maxPack._max.sortOrder ?? -1) + 1,
        },
      });
    }

    return NextResponse.json({ video });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not create video (duplicate title?)' }, { status: 400 });
  }
}
