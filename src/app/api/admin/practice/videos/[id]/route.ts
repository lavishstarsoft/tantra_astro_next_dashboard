import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({ practiceEnabled: z.boolean() });

// Super Admin hides/unhides Practice for a lesson WITHOUT changing the video itself.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const exists = await prisma.video.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const updated = await prisma.video.update({
    where: { id },
    data: { practiceEnabled: parsed.data.practiceEnabled },
  });
  return NextResponse.json({ ok: true, practiceEnabled: updated.practiceEnabled });
}
