import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { PracticeQuestionManager } from '@/components/practice-question-manager';

export const dynamic = 'force-dynamic';

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export default async function ManageQuestionsPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) notFound();

  const questions = await prisma.quizQuestion.findMany({
    where: { videoId },
    orderBy: { sortOrder: 'asc' },
  });

  const initial = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: safeParse(q.optionsJson),
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    topic: q.topic ?? '',
    sortOrder: q.sortOrder,
    active: q.active,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/practice" className="text-sm text-sky-600">
          ← Back to Practice &amp; Master
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-800">Questions — {video.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Practice is {video.practiceEnabled ? 'ENABLED' : 'DISABLED'} for this lesson.
        </p>
      </div>
      <PracticeQuestionManager videoId={videoId} initial={initial} />
    </div>
  );
}
