import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const s = await prisma.shortLesson.findFirst({ where: { id, published: true } });
    if (!s) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      ok: true,
      short: {
        id: s.id, title: s.title, topic: s.topic || 'General', teacher: s.teacher || '',
        videoUrl: s.videoUrl, thumbnail: s.thumbnailUrl || undefined, duration: s.duration || 0,
        caption: s.caption || undefined, linkedVideoTitle: s.linkedVideoTitle || undefined,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'error' }, { status: 500 });
  }
}
