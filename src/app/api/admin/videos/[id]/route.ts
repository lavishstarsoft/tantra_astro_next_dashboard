import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const LANGUAGE_OPTIONS = ['Telugu', 'Tamil', 'Hindi', 'English'] as const;

function parseAmountFromLabel(label?: string | null): number | null {
  if (!label) return null;
  const match = label.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const rupees = Number(match[1]);
  if (!Number.isFinite(rupees) || rupees <= 0) return null;
  return Math.round(rupees * 100);
}

const patchSchema = z
  .object({
    subtitle: z.string().min(1).optional(),
    meta: z.string().min(1).optional(),
    duration: z.string().min(1).optional(),
    level: z.string().min(1).optional(),
    language: z.enum(LANGUAGE_OPTIONS).optional(),
    lessons: z.number().int().nonnegative().optional(),
    priceLabel: z.string().optional(),
    individualPriceLabel: z.string().nullable().optional(),
    rating: z.number().min(0).max(5).optional(),
    description: z.string().min(1).optional(),
    thumbnailUrl: z.string().min(1).optional(),
    dashUrl: z.string().url().optional(),
    topics: z.array(z.string()).optional(),
    isFree: z.boolean().optional(),
    accessValidityDays: z.number().int().min(0).optional(),
    published: z.boolean().optional(),
    categoryName: z.string().min(1).optional(),
    addToCategoryPack: z.boolean().optional(),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await ctx.params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: { category: true, packItems: true },
  });
  if (!video) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ video });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const original = await prisma.video.findUnique({ where: { id } });
  if (!original) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...body };
  const addToCategoryPack = body.addToCategoryPack;
  delete data.addToCategoryPack;
  if (body.topics) {
    data.topicsJson = JSON.stringify(body.topics);
    delete data.topics;
  }
  if (body.categoryName) {
    const cat = await prisma.category.findFirst({ where: { name: body.categoryName } });
    if (!cat) {
      return NextResponse.json({ error: `Unknown category: ${body.categoryName}` }, { status: 400 });
    }
    data.categoryId = cat.id;
    delete data.categoryName;
  }
  if (body.isFree === true) {
    data.checkoutAmountCents = 0;
    data.accessValidityDays = 0;
  } else if (body.isFree === false || body.priceLabel || body.individualPriceLabel !== undefined) {
    const amount = parseAmountFromLabel(
      body.individualPriceLabel === null ? body.priceLabel : (body.individualPriceLabel ?? body.priceLabel)
    );
    if (amount) {
      data.checkoutAmountCents = amount;
    }
  }

  try {
    const video = await prisma.video.update({
      where: { id },
      data: data as object,
      include: { category: true },
    });

    if (addToCategoryPack !== undefined) {
      if (!addToCategoryPack) {
        await prisma.categoryPackItem.deleteMany({ where: { videoId: id } });
      } else {
        const maxPack = await prisma.categoryPackItem.aggregate({
          where: { categoryId: video.categoryId },
          _max: { sortOrder: true },
        });
        await prisma.categoryPackItem.upsert({
          where: {
            categoryId_videoId: {
              categoryId: video.categoryId,
              videoId: id,
            },
          },
          update: {},
          create: {
            categoryId: video.categoryId,
            videoId: id,
            sortOrder: (maxPack._max.sortOrder ?? -1) + 1,
          },
        });
      }
    } else if (original.categoryId !== video.categoryId) {
      const oldPack = await prisma.categoryPackItem.findFirst({
        where: { categoryId: original.categoryId, videoId: id },
      });
      if (oldPack) {
        await prisma.categoryPackItem.delete({ where: { id: oldPack.id } });
        const maxPack = await prisma.categoryPackItem.aggregate({
          where: { categoryId: video.categoryId },
          _max: { sortOrder: true },
        });
        await prisma.categoryPackItem.create({
          data: {
            categoryId: video.categoryId,
            videoId: id,
            sortOrder: (maxPack._max.sortOrder ?? -1) + 1,
          },
        });
      }
    }

    return NextResponse.json({ video });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await ctx.params;
  try {
    await prisma.video.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 400 });
  }
}
