import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  topic: z.string().max(60).optional(),
  teacher: z.string().max(120).optional(),
  videoUrl: z.string().url().max(1000).optional(),
  thumbnailUrl: z.string().max(1000).optional(),
  duration: z.number().int().min(0).max(3600).optional(),
  caption: z.string().max(300).optional(),
  linkedVideoTitle: z.string().max(200).nullable().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

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

  const d = parsed.data;
  try {
    await prisma.shortLesson.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.topic !== undefined ? { topic: d.topic } : {}),
        ...(d.teacher !== undefined ? { teacher: d.teacher } : {}),
        ...(d.videoUrl !== undefined ? { videoUrl: d.videoUrl } : {}),
        ...(d.thumbnailUrl !== undefined ? { thumbnailUrl: d.thumbnailUrl } : {}),
        ...(d.duration !== undefined ? { duration: d.duration } : {}),
        ...(d.caption !== undefined ? { caption: d.caption } : {}),
        ...(d.linkedVideoTitle !== undefined ? { linkedVideoTitle: d.linkedVideoTitle || null } : {}),
        ...(d.published !== undefined ? { published: d.published } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Short not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  try {
    await prisma.shortLesson.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: 'Short not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
