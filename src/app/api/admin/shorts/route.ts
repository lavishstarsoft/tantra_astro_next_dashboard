import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const shorts = await prisma.shortLesson.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ ok: true, shorts });
}

const createSchema = z.object({
  title: z.string().min(1).max(160),
  topic: z.string().max(60).optional(),
  teacher: z.string().max(120).optional(),
  videoUrl: z.string().url().max(1000),
  thumbnailUrl: z.string().max(1000).optional(),
  duration: z.number().int().min(0).max(3600).optional(),
  caption: z.string().max(300).optional(),
  linkedVideoTitle: z.string().max(200).optional(),
  published: z.boolean().optional(),
});

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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const last = await prisma.shortLesson.findFirst({ orderBy: { sortOrder: 'desc' } });
  const created = await prisma.shortLesson.create({
    data: {
      title: parsed.data.title,
      topic: parsed.data.topic || 'General',
      teacher: parsed.data.teacher || '',
      videoUrl: parsed.data.videoUrl,
      thumbnailUrl: parsed.data.thumbnailUrl || '',
      duration: parsed.data.duration ?? 0,
      caption: parsed.data.caption || '',
      linkedVideoTitle: parsed.data.linkedVideoTitle || null,
      published: parsed.data.published ?? true,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
