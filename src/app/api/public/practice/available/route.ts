import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { requireIos } from '@/lib/platform';
import { prisma } from '@/lib/prisma';

// iOS-only. Returns titles that currently show "Practice This Lesson":
// global flag ON + video.practiceEnabled ON + at least one active question.
export async function GET(req: Request) {
  const ios = requireIos(req);
  if (!ios.ok) return ios.response;
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const cfg = await prisma.appHomeConfig.findUnique({ where: { key: 'default' } });
  if (!cfg?.practiceMasterEnabled) return NextResponse.json({ ok: true, titles: [] });

  const videos = await prisma.video.findMany({
    where: { practiceEnabled: true, published: true },
    select: { id: true, title: true, quizQuestions: { where: { active: true }, select: { id: true } } },
  });
  const titles = videos.filter((v) => v.quizQuestions.length > 0).map((v) => v.title);
  return NextResponse.json({ ok: true, titles });
}
