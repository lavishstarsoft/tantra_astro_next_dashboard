import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

// List all questions for a video (admin).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const questions = await prisma.quizQuestion.findMany({
    where: { videoId: id },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({
    ok: true,
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: safeParseOptions(q.optionsJson),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      topic: q.topic ?? '',
      sortOrder: q.sortOrder,
      active: q.active,
    })),
  });
}

const createSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().max(1000).optional(),
  topic: z.string().max(80).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { id } = await params;

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.correctIndex >= parsed.data.options.length) {
    return NextResponse.json({ error: 'correctIndex out of range' }, { status: 400 });
  }

  const last = await prisma.quizQuestion.findFirst({
    where: { videoId: id },
    orderBy: { sortOrder: 'desc' },
  });
  const created = await prisma.quizQuestion.create({
    data: {
      videoId: id,
      prompt: parsed.data.prompt,
      optionsJson: JSON.stringify(parsed.data.options),
      correctIndex: parsed.data.correctIndex,
      explanation: parsed.data.explanation ?? '',
      topic: parsed.data.topic || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      active: true,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}

function safeParseOptions(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
