import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  videoTitle: z.string().min(1),
  currentTime: z.number().finite().min(0),
  duration: z.number().finite().positive(),
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
    select: { id: true },
  });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const cappedCurrent = Math.min(parsed.data.currentTime, parsed.data.duration);

  await prisma.userVideoProgress.upsert({
    where: {
      userId_videoId: {
        userId: gate.user.id,
        videoId: video.id,
      },
    },
    update: {
      currentTime: cappedCurrent,
      duration: parsed.data.duration,
    },
    create: {
      userId: gate.user.id,
      videoId: video.id,
      currentTime: cappedCurrent,
      duration: parsed.data.duration,
    },
  });

  return NextResponse.json({ ok: true });
}
