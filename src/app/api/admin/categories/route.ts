import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

function parseAmountFromLabel(label?: string): number | null {
  if (!label) return null;
  const match = label.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const rupees = Number(match[1]);
  if (!Number.isFinite(rupees) || rupees <= 0) return null;
  return Math.round(rupees * 100);
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  packPriceLabel: z.string().min(1),
  thumbnailUrl: z.string().optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { videos: true, packItems: true } } },
  });
  return NextResponse.json({ categories });
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
  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;

  try {
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        packPriceLabel: body.packPriceLabel.trim(),
        thumbnailUrl: body.thumbnailUrl?.trim() ?? '',
        checkoutAmountCents: parseAmountFromLabel(body.packPriceLabel) ?? 799_900,
        sortOrder,
      },
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: 'Could not create category (duplicate name?)' }, { status: 400 });
  }
}
