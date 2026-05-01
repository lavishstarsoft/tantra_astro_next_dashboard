import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  videoTitle: z.string().min(1),
});

export async function POST(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { title: parsed.data.videoTitle },
    select: { id: true, title: true },
  });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const existing = await prisma.userBookmark.findUnique({
    where: {
      userId_videoId: {
        userId: gate.user.id,
        videoId: video.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.userBookmark.delete({
      where: {
        userId_videoId: {
          userId: gate.user.id,
          videoId: video.id,
        },
      },
    });
    return NextResponse.json({ ok: true, bookmarked: false, videoTitle: video.title });
  }

  await prisma.userBookmark.create({
    data: {
      userId: gate.user.id,
      videoId: video.id,
    },
  });

  return NextResponse.json({ ok: true, bookmarked: true, videoTitle: video.title });
}
