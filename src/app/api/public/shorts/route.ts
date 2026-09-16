import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Public list of published quick lessons for the app's shorts feed.
export async function GET() {
  try {
    const rows = await prisma.shortLesson.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    const shorts = rows.map((s) => ({
      id: s.id,
      title: s.title,
      topic: s.topic || 'General',
      teacher: s.teacher || '',
      videoUrl: s.videoUrl,
      thumbnail: s.thumbnailUrl || undefined,
      duration: s.duration || 0,
      caption: s.caption || undefined,
      linkedVideoTitle: s.linkedVideoTitle || undefined,
    }));
    return NextResponse.json({ ok: true, shorts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    return NextResponse.json({ ok: false, shorts: [], error: msg }, { status: 200 });
  }
}
