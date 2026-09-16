import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const upsertSchema = z.object({
  key: z.enum(['terms', 'help', 'invite_playstore_url']),
  title: z.string().min(3).max(120),
  content: z.string().min(1),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const pages = await prisma.appContentPage.findMany({
    where: { key: { in: ['terms', 'help', 'invite_playstore_url'] } },
    orderBy: { key: 'asc' },
  });

  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const page = await prisma.appContentPage.upsert({
    where: { key: parsed.data.key },
    update: {
      title: parsed.data.title.trim(),
      content: parsed.data.content.trim(),
    },
    create: {
      key: parsed.data.key,
      title: parsed.data.title.trim(),
      content: parsed.data.content.trim(),
    },
  });

  return NextResponse.json({ page });
}

