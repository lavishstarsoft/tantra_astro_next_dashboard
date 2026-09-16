import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

// Global Practice & Master ON/OFF switch (stored on AppHomeConfig).
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const cfg = await prisma.appHomeConfig.findUnique({ where: { key: 'default' } });
  return NextResponse.json({ ok: true, practiceMasterEnabled: cfg?.practiceMasterEnabled ?? false });
}

const patchSchema = z.object({ practiceMasterEnabled: z.boolean() });

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.appHomeConfig.upsert({
    where: { key: 'default' },
    update: { practiceMasterEnabled: parsed.data.practiceMasterEnabled },
    create: { key: 'default', practiceMasterEnabled: parsed.data.practiceMasterEnabled },
  });
  return NextResponse.json({ ok: true, practiceMasterEnabled: updated.practiceMasterEnabled });
}
