import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  prompt: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).min(2).max(6).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().max(1000).optional(),
  topic: z.string().max(80).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

// Edit / reorder / enable-disable a question.
export async function PATCH(req: Request, { params }: { params: Promise<{ qid: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { qid } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.quizQuestion.findUnique({ where: { id: qid } });
  if (!existing) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  const nextOptions = parsed.data.options ?? safeParseOptions(existing.optionsJson);
  const nextCorrect = parsed.data.correctIndex ?? existing.correctIndex;
  if (nextCorrect >= nextOptions.length) {
    return NextResponse.json({ error: 'correctIndex out of range' }, { status: 400 });
  }

  const updated = await prisma.quizQuestion.update({
    where: { id: qid },
    data: {
      ...(parsed.data.prompt !== undefined ? { prompt: parsed.data.prompt } : {}),
      ...(parsed.data.options !== undefined ? { optionsJson: JSON.stringify(parsed.data.options) } : {}),
      ...(parsed.data.correctIndex !== undefined ? { correctIndex: parsed.data.correctIndex } : {}),
      ...(parsed.data.explanation !== undefined ? { explanation: parsed.data.explanation } : {}),
      ...(parsed.data.topic !== undefined ? { topic: parsed.data.topic || null } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
  });
  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ qid: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { qid } = await params;
  try {
    await prisma.quizQuestion.delete({ where: { id: qid } });
  } catch {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

function safeParseOptions(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
