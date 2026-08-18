import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAppUser } from '@/lib/app-auth';
import { requireIos } from '@/lib/platform';
import { prisma } from '@/lib/prisma';

const submitSchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string().min(1), selectedIndex: z.number().int().min(0) }))
    .min(1),
});

// iOS-only. Server scores deterministically against stored correct answers.
// Client-sent correctness/scores are ignored. Result is upserted per user+video.
export async function POST(req: Request, { params }: { params: Promise<{ title: string }> }) {
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const questions = await prisma.quizQuestion.findMany({
    where: { videoId: video.id, active: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (questions.length === 0) return NextResponse.json({ error: 'Not available' }, { status: 404 });

  // Only accept answers for real, active questions of THIS video (anti-fabrication).
  const byId = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(parsed.data.answers.map((a) => [a.questionId, a.selectedIndex]));

  let correct = 0;
  const results = questions.map((q) => {
    const selected = answerMap.get(q.id);
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correct += 1;
    return {
      questionId: q.id,
      selectedIndex: selected ?? null,
      correctIndex: q.correctIndex,
      correct: isCorrect,
      explanation: q.explanation,
    };
  });
  const total = questions.length;
  const topic = questions.find((q) => q.topic)?.topic ?? null;

  await prisma.quizResult.upsert({
    where: { userId_videoId: { userId: gate.user.id, videoId: video.id } },
    update: { correct, total, topic },
    create: { userId: gate.user.id, videoId: video.id, correct, total, topic },
  });

  return NextResponse.json({ ok: true, correct, total, results });
}
