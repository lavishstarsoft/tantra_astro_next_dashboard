import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      })
    )
    .min(1),
});

// Persist the app display order for category sections.
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await Promise.all(
      parsed.data.items.map((item) =>
        prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
      )
    );
    return NextResponse.json({ ok: true, updated: parsed.data.items.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reorder failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
