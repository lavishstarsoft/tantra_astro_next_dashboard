import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const patchSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    subtitle: z.string().max(200).optional(),
    imageUrl: z.string().min(1).optional(),
    kind: z.enum(['custom', 'video', 'category', 'url']).optional(),
    target: z.string().optional(),
    sortOrder: z.number().int().optional(),
    active: z.boolean().optional(),
    startAt: z.string().datetime().nullable().optional(),
    endAt: z.string().datetime().nullable().optional(),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
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
  const data: Record<string, unknown> = { ...body };
  if (body.startAt !== undefined) data.startAt = body.startAt ? new Date(body.startAt) : null;
  if (body.endAt !== undefined) data.endAt = body.endAt ? new Date(body.endAt) : null;

  const item = await prisma.carouselItem.update({ where: { id }, data: data as object });
  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await prisma.carouselItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

