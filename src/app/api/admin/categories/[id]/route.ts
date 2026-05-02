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

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    packPriceLabel: z.string().min(1).optional(),
    accessValidityDays: z.number().int().min(0).optional(),
    thumbnailUrl: z.string().optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

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

  const data = { ...parsed.data } as { 
    name?: string; 
    packPriceLabel?: string; 
    accessValidityDays?: number; 
    thumbnailUrl?: string; 
    sortOrder?: number; 
    checkoutAmountCents?: number 
  };
  if (data.packPriceLabel) {
    data.checkoutAmountCents = parseAmountFromLabel(data.packPriceLabel) ?? 799_900;
  }

  const category = await prisma.category.update({
    where: { id },
    data,
  });
  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await ctx.params;

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 400 });
  }
}
