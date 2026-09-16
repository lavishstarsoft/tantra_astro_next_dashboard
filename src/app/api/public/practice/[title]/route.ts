import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { requireIos } from '@/lib/platform';
import { prisma } from '@/lib/prisma';

// iOS-only. Returns questions WITHOUT correct answers/explanations (server keeps them).
export async function GET(req: Request, { params }: { params: Promise<{ title: string }> }) {
  const ios = requireIos(req);
  if (!ios.ok) return ios.response;
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const cfg = await prisma.appHomeConfig.findUnique({ where: { key: 'default' } });
  if (!cfg?.practiceMasterEnabled) return NextResponse.json({ error: 'Not available' }, { status: 404 });

  const { title } = await params;
  const video = await prisma.video.findUnique({ where: { title: decodeURIComponent(title) } });
  if (!video || !video.practiceEnabled) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const questions = await prisma.quizQuestion.findMany({
    where: { videoId: video.id, active: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (questions.length === 0) return NextResponse.json({ error: 'Not available' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    videoTitle: video.title,
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: safeParseOptions(q.optionsJson),
    })),
  });
}

function safeParseOptions(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
