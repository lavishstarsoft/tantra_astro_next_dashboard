import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  title: z.string().min(1).max(160),
  subtitle: z.string().max(200).optional().default(''),
  imageUrl: z.string().min(1),
  kind: z.enum(['custom', 'video', 'category', 'url']).default('custom'),
  target: z.string().optional().default(''),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const items = await prisma.carouselItem.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

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
  const item = await prisma.carouselItem.create({
    data: {
      title: body.title.trim(),
      subtitle: body.subtitle?.trim() ?? '',
      imageUrl: body.imageUrl.trim(),
      kind: body.kind,
      target: body.target?.trim() ?? '',
      sortOrder: body.sortOrder,
      active: body.active,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
    },
  });
  return NextResponse.json({ item });
}

